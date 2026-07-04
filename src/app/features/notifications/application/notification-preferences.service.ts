import { Injectable, inject, signal } from '@angular/core';
import {
  NotificationPreferencesHttp,
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest,
} from '../infrastructure/notification-preferences.http';

@Injectable({providedIn: 'root'})
export class NotificationPreferencesService{
  private readonly http = inject(NotificationPreferencesHttp);

  readonly preferences= signal<NotificationPreferencesResponse | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  async load(): Promise<NotificationPreferencesResponse>{
    this.loading.set(true);

    try{
      const preferences = await this.http.getPreferences();
      this.preferences.set(preferences);
      return preferences;
    } finally {
      this.loading.set(false);
    }
  }

  async update(body: UpdateNotificationPreferencesRequest,): Promise<NotificationPreferencesResponse>{
    this.saving.set(true);
    try{
      const updated = await this.http.updatePreferences(body);
      this.preferences.set(updated);
      return updated;
    } finally {
      this.saving.set(false);
    }
  }


}
