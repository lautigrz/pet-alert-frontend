import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LostNearbyNotification } from "../domain/lost-nearby-notification";

@Injectable({ providedIn: 'root' })
export class NotificationHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  registerToken(token: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/notifications/tokens`, { token }),
    );
  }

  removeToken(token: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/notifications/tokens`, { body: { token } }),
    );
  }

  getLostNearby(): Promise<LostNearbyNotification[]> {
    return firstValueFrom(
      this.http.get<LostNearbyNotification[]>(
        `${this.baseUrl}/notifications/lost-nearby`,
      ),
    );
  }

  markLostNearbyAsSeen(
    notificationPublicId: string,
    ): Promise<void> {
      return firstValueFrom(
        this.http.patch<void>(
        `${this.baseUrl}/notifications/lost-nearby/${notificationPublicId}/seen`,
        {},
      ),
    );
  }
}
