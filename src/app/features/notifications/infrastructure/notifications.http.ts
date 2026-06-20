import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { MatchNotification } from '../domain/match-notification';

@Injectable({ providedIn: 'root' })
export class NotificationsHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getMine(): Promise<MatchNotification[]> {
    return firstValueFrom(this.http.get<MatchNotification[]>(`${this.baseUrl}/match/notifications`));
  }
}
