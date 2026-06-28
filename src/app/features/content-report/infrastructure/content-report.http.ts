import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ContentReportReason, ContentReportTargetType } from '../domain/content-report.models';

export interface CreateContentReportRequest {
  targetType: ContentReportTargetType;
  targetPublicId: string;
  reason: ContentReportReason;
  description?: string;
}

export interface CreateContentReportResponse {
  message: string;
  publicId: string;
  autoFlagged: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContentReportHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createContentReport(body: CreateContentReportRequest): Promise<CreateContentReportResponse> {
    return firstValueFrom(
      this.http.post<CreateContentReportResponse>(`${this.baseUrl}/content-reports`, body),
    );
  }
}
