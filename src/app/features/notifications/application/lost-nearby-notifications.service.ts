import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { SocketService } from '../../../core/services/socket.service';

import { NotificationHttp } from '../infrastructure/notification.http';

import {  LOST_NEARBY_EVENT,  LostNearbyNotification,  LostNearbySocketNotification} from '../domain/lost-nearby-notification';


@Injectable({
  providedIn: 'root',
})
export class LostNearbyNotificationsService {
  private readonly socketService = inject(SocketService);
  private readonly notificationHttp = inject(NotificationHttp);

  private readonly _notifications = signal<LostNearbyNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(
    () => this._notifications().filter((n) => !n.seen).length,
  );

  private subscription: Subscription | null = null;
  private loaded = false;

  escuchar(): void {
    if (this.subscription) return;

    this.subscription = this.socketService
      .on<LostNearbySocketNotification>(LOST_NEARBY_EVENT)
      .subscribe((payload) => this.agregar(payload));
  }

  async load(): Promise<void> {
    if (this.loaded) return;

    this.loaded = true;

    try {
      const notifications =
        await this.notificationHttp.getLostNearby();

      this.fusionar(notifications);
    } catch {
      this.loaded = false;
    }
  }

  async markAsSeen(
    notificationPublicId: string,
  ): Promise<void> {
    await this.notificationHttp.markLostNearbyAsSeen(
      notificationPublicId,
    );

    this._notifications.update((notifications) =>
      notifications.map((notification) =>
        notification.notificationPublicId === notificationPublicId
          ? { ...notification, seen: true }
          : notification,
      ),
    );
  }

  clear(): void {
    this.loaded = false;
    this._notifications.set([]);
  }

  private agregar(
    payload: LostNearbySocketNotification,
  ): void {
    this._notifications.update((notifications) => {
      if (
        notifications.some(
          (n) =>
            n.notificationPublicId ===
            payload.notificationPublicId,
        )
      ) {
        return notifications;
      }

      return [
        {
          ...payload,
        },
        ...notifications,
      ];
    });
  }

  private fusionar(
    remotas: LostNearbyNotification[],
  ): void {
    this._notifications.update((actuales) => {
      const porId = new Map(
        actuales.map((n) => [
          n.notificationPublicId,
          n,
        ]),
      );

      for (const remota of remotas) {
        porId.set(
          remota.notificationPublicId,
          remota,
        );
      }

      return [...porId.values()].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    });
  }
}