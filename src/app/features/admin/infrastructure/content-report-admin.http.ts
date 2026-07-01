import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ContentReportReason,
  ContentReportTargetType,
} from '../../content-report/domain/content-report.models';

export interface ContentReportQueueItemResponse {
  publicId: string;
  targetType: ContentReportTargetType;
  targetPublicId: string;
  reason: ContentReportReason;
  status: string;
  description: string | null;
  autoFlagged: boolean;
  createdAt: string;
  reportCount?: number;
  suspensionReason?: string | null;
  reportedUser?: { username: string; email: string | null } | null;
  reportedContent?: { petName: string | null; reportType: 'LOST' | 'SIGHTING' } | null;
  reporter: { publicId: string; username: string; email?: string | null };
}

export interface ResolveContentReportResult {
  autoSuspended: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContentReportAdminHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getQueue(status: string): Promise<ContentReportQueueItemResponse[]> {
    return firstValueFrom(
      this.http.get<ContentReportQueueItemResponse[]>(`${this.baseUrl}/content-reports`, {
        params: { status },
      }),
    );
  }

  resolve(publicId: string, status: string, suspensionReason?: string): Promise<ResolveContentReportResult> {
    return firstValueFrom(
      this.http.patch<ResolveContentReportResult>(`${this.baseUrl}/content-reports/${publicId}`, {
        status,
        ...(suspensionReason ? { suspensionReason } : {}),
      }),
    );
  }
}
