import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MatchViewsHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getSeen(): Promise<string[]> {
    return firstValueFrom(this.http.get<string[]>(`${this.baseUrl}/match/views`));
  }

  markSeen(matchPublicId: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/match/${matchPublicId}/seen`, {}),
    );
  }
}
