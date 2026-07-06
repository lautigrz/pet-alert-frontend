import { Injectable, inject } from '@angular/core';
import {
  ContentReportAdminHttp,
  ContentReportQueueItemResponse,
  ResolveContentReportResult,
} from '../infrastructure/content-report-admin.http';
import {
  ContentReportQueueItem,
  ContentReportStatus,
} from '../domain/content-report-queue.model';

const BACKEND_STATUSES = ['PENDING', 'REVIEWED', 'DISMISSED', 'SUSPENDED'];

@Injectable({ providedIn: 'root' })
export class ContentReportAdminService {
  private readonly http = inject(ContentReportAdminHttp);

  async getQueue(): Promise<ContentReportQueueItem[]> {
    const responses = await Promise.all(
      BACKEND_STATUSES.map((status) => this.http.getQueue(status)),
    );
    const items = responses.flat();
    const counts = this.countByTarget(items);
    return items.map((item) => this.toQueueItem(item, counts));
  }

  resolve(
    publicId: string,
    status: ContentReportStatus,
    suspensionReason?: string,
  ): Promise<ResolveContentReportResult> {
    return this.http.resolve(publicId, this.toBackendStatus(status), suspensionReason);
  }

  private toBackendStatus(status: ContentReportStatus): string {
    return status === 'APPROVED' ? 'REVIEWED' : status;
  }

  private countByTarget(items: ContentReportQueueItemResponse[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.targetPublicId, (counts.get(item.targetPublicId) ?? 0) + 1);
    }
    return counts;
  }

  private toQueueItem(
    item: ContentReportQueueItemResponse,
    counts: Map<string, number>,
  ): ContentReportQueueItem {
    return {
      publicId: item.publicId,
      targetType: item.targetType,
      targetPublicId: item.targetPublicId,
      reason: item.reason,
      status: this.normalizeStatus(item.status),
      description: item.description ?? null,
      autoFlagged: item.autoFlagged,
      createdAt: item.createdAt,
      reportCount: item.reportCount ?? counts.get(item.targetPublicId) ?? 1,
      suspensionReason: item.suspensionReason ?? null,
      reportedUser: item.reportedUser ?? null,
      reportedContent: item.reportedContent ?? null,
      reporter: {
        username: item.reporter.username,
        email: item.reporter.email ?? null,
      },
    };
  }

  private normalizeStatus(status: string): ContentReportStatus {
    switch (status) {
      case 'APPROVED':
        return 'APPROVED';
      case 'SUSPENDED':
        return 'SUSPENDED';
      case 'DISMISSED':
        return 'DISMISSED';
      case 'REVIEWED':
        return 'APPROVED';
      default:
        return 'PENDING';
    }
  }
}
