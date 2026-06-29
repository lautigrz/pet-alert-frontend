import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface MatchResult {
  publicId: string;
  sourceReportPublicId: string;
  score: number;
  imageScore: number;
  descriptionScore: number;
  details: {
    publicId: string;
    images: string[];
    animalType: string;
  };
}

@Injectable({ providedIn: 'root' })
export class MatchHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getByReport(publicId: string): Promise<MatchResult[]> {
    return firstValueFrom(
      this.http.get<MatchResult[]>(`${this.baseUrl}/match/${publicId}`),
    );
  }
}
