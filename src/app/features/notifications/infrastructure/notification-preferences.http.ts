import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface NotificationPreferencesResponse {
  notificationRadius: number,
  lostReportsEnabled: boolean,
  sightingReportsEnabled: boolean,
  matchesEnabled: boolean,
  mutedUntil: string | null,
}

export interface UpdateNotificationPreferencesRequest{
  notificationRadius?: number,
  lostReportsEnabled?: boolean,
  sightingReportsEnabled?: boolean,
  matchesEnabled?: boolean,
  mutedUntil?: string | null,
}


@Injectable({providedIn:'root'})
export class NotificationPreferencesHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getPreferences(): Promise<NotificationPreferencesResponse> {
    return firstValueFrom(this.http.get<NotificationPreferencesResponse>(`${this.baseUrl}/users/preferences`));
  }

  updatePreferences(body: UpdateNotificationPreferencesRequest,): Promise<NotificationPreferencesResponse> {
    return firstValueFrom(this.http.patch<NotificationPreferencesResponse>(`${this.baseUrl}/users/preferences`, body,));
  }
}
