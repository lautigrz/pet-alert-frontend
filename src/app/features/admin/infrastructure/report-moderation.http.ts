import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ReportModerationResponse {
  type: string;
  description: string;
  location: { address: string };
  occurredAt: string;
  details: {
    name?: string;
    petName?: string;
    animalType: string;
    color: string;
    images: { url: string }[];
  };
}

@Injectable({ providedIn: 'root' })
export class ReportModerationHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getReport(publicId: string): Promise<ReportModerationResponse> {
    return firstValueFrom(
      this.http.get<ReportModerationResponse>(`${this.baseUrl}/reports/${publicId}/moderation`),
    );
  }
}
