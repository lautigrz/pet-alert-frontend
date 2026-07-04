import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppealTargetType } from '../domain/appeal-queue.model';

export interface AppealCaseResponse {
  reportedContent: { petName: string | null; reportType: string } | null;
  reason: string | null;
  reportCount: number;
}

export interface AppealQueueItemResponse {
  publicId: string;
  targetType: AppealTargetType;
  targetPublicId: string;
  message: string;
  status: string;
  createdAt: string;
  appellant: { publicId: string; username: string };
  case: AppealCaseResponse;
}

@Injectable({ providedIn: 'root' })
export class AppealAdminHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getQueue(status: string): Promise<AppealQueueItemResponse[]> {
    return firstValueFrom(
      this.http.get<AppealQueueItemResponse[]>(`${this.baseUrl}/appeals`, { params: { status } }),
    );
  }

  resolve(publicId: string, accept: boolean): Promise<void> {
    return firstValueFrom(
      this.http.patch<void>(`${this.baseUrl}/appeals/${publicId}`, { accept }),
    );
  }
}
