import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CoverageResponse {
  cells: string[];
  lastSyncTimestamp?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MissionCoverageHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  postCoverage(missionId: string, cells: string[]): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/missions/${missionId}/coverage`,
      { cells }
    );
  }

  getCoverage(missionId: string, since?: string): Observable<CoverageResponse> {
    const params: Record<string, string> = {};
    if (since) {
      params['since'] = since;
    }
    return this.http.get<CoverageResponse>(
      `${this.baseUrl}/missions/${missionId}/coverage`,
      { params }
    );
  }
}
