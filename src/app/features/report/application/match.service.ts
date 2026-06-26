import { Injectable, inject } from '@angular/core';

import { MatchHttp, MatchResult } from '../infrastructure/match.http';
import { ReportDetail } from '../infrastructure/report.http';
import { ReportService } from './report.service';
import { Match, ReportMatches } from '../domain/match.model';
import { NotificationsHttp } from '../../notifications/infrastructure/notifications.http';
import { MatchNotification } from '../../notifications/domain/match-notification';

const MIN_MATCH_SCORE = 0.7;

interface Candidate {
  publicId: string;
  score: number;
  imageScore: number | null;
  descriptionScore: number | null;
  fallbackImage: string | null;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly matchHttp = inject(MatchHttp);
  private readonly notificationsHttp = inject(NotificationsHttp);
  private readonly reportService = inject(ReportService);

  async getReportMatches(reportPublicId: string): Promise<ReportMatches> {
    const [report, sourceResults, notifications] = await Promise.all([
      this.reportService.getReportByPublicId(reportPublicId),
      this.matchHttp.getByReport(reportPublicId),
      this.notificationsHttp.getMine().catch(() => [] as MatchNotification[]),
    ]);

    const candidates = this.mergeCandidates(reportPublicId, sourceResults, notifications);

    const details = await Promise.all(candidates.map((candidate) => this.loadDetail(candidate.publicId)));

    return {
      report,
      matches: candidates
        .map((candidate, i) => ({ match: this.toMatch(candidate, details[i], report), detail: details[i] }))
        .filter(
          ({ match, detail }) =>
            (!detail || detail.status === 'ACTIVE') &&
            match.score >= MIN_MATCH_SCORE &&
            match.reportPublicId !== report.publicId &&
            match.userPublicId !== report.user.publicId,
        )
        .map(({ match }) => match)
        .sort((a, b) => b.score - a.score),
    };
  }

  private mergeCandidates(
    reportPublicId: string,
    sourceResults: MatchResult[],
    notifications: MatchNotification[],
  ): Candidate[] {
    const byPublicId = new Map<string, Candidate>();

    const add = (
      publicId: string,
      score: number,
      imageScore: number | null,
      descriptionScore: number | null,
      image: string | null,
    ): void => {
      const current = byPublicId.get(publicId);
      if (!current) {
        byPublicId.set(publicId, { publicId, score, imageScore, descriptionScore, fallbackImage: image });
        return;
      }
      current.imageScore = current.imageScore ?? imageScore;
      current.descriptionScore = current.descriptionScore ?? descriptionScore;
      current.fallbackImage = current.fallbackImage ?? image;
    };

    for (const result of sourceResults) {
      add(result.details.publicId, result.score, result.imageScore, result.descriptionScore, result.details.images[0] ?? null);
    }

    for (const notification of notifications) {
      const imageScore = notification.imageScore ?? null;
      const descriptionScore = notification.descriptionScore ?? null;
      if (notification.lostReportPublicId === reportPublicId) {
        add(notification.matchedReportPublicId, notification.score, imageScore, descriptionScore, notification.matchedImage);
      } else if (notification.matchedReportPublicId === reportPublicId) {
        add(notification.lostReportPublicId, notification.score, imageScore, descriptionScore, notification.matchedImage);
      }
    }

    return [...byPublicId.values()];
  }

  private async loadDetail(publicId: string): Promise<ReportDetail | null> {
    try {
      return await this.reportService.getReportByPublicId(publicId);
    } catch {
      return null;
    }
  }

  private toMatch(candidate: Candidate, detail: ReportDetail | null, source: ReportDetail): Match {
    const name = detail ? this.buildTitle(detail) : 'Coincidencia';

    const image = detail?.details.images[0]?.url ?? candidate.fallbackImage ?? null;

    const distanceKm = detail ? this.distanceKm(source.location, detail.location) : null;

    return {
      matchPublicId: candidate.publicId,
      reportPublicId: candidate.publicId,
      userPublicId: detail?.user.publicId ?? '',
      name,
      image,
      username: detail?.user.username ?? '',
      foundAt: detail?.occurredAt ?? null,
      distanceKm,
      score: candidate.score,
      imageScore: candidate.imageScore,
      descriptionScore: candidate.descriptionScore,
    };
  }

  private buildTitle(detail: ReportDetail): string {
    if (detail.details.name) return detail.details.name;
    if (detail.details.petName) return detail.details.petName;

    const animal = detail.details.animalType === 'CAT' ? 'Gato' : 'Perro';
    const estado =
      detail.type === 'LOST'
        ? 'perdido'
        : detail.details.isInTransit
          ? 'en tránsito'
          : 'avistado';
    return `${animal} ${estado}`;
  }

  private distanceKm(
    source: ReportDetail['location'],
    target: ReportDetail['location'],
  ): number {
    const earthRadius = 6371;
    const dLat = this.toRadians(target.latitude - source.latitude);
    const dLon = this.toRadians(target.longitude - source.longitude);
    const lat1 = this.toRadians(source.latitude);
    const lat2 = this.toRadians(target.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(earthRadius * c * 10) / 10;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
