import { Injectable, NgZone, inject, signal } from '@angular/core';
import { MessagePayload } from 'firebase/messaging';
import { FirebaseMessagingClient } from '../infrastructure/firebase-messaging.client';
import { NotificationHttp } from '../infrastructure/notification.http';
import { ToastService } from '../../../shared/application/toast.service';
import { NotificationPermissionState } from '../domain/notification.types';

const FCM_SW_URL = '/firebase-messaging-sw.js';
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';
const ACTIVE_KEY = 'petfinder.notif-active';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly fcm = inject(FirebaseMessagingClient);
  private readonly http = inject(NotificationHttp);
  private readonly toast = inject(ToastService);
  private readonly zone = inject(NgZone);

  private listenersStarted = false;

  readonly permission = signal<NotificationPermissionState>(this.readPermission());
  readonly active = signal<boolean>(localStorage.getItem(ACTIVE_KEY) === '1');
  readonly busy = signal(false);

  isSupported(): boolean {
    return typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
  }

  async enable(): Promise<boolean> {
    this.busy.set(true);
    try {
      return await this.runEnable();
    } finally {
      this.busy.set(false);
    }
  }

  private async runEnable(): Promise<boolean> {
    if (!this.isSupported() || !(await this.askPermission())) return false;
    return this.subscribe();
  }

  private async subscribe(): Promise<boolean> {
    this.toast.info('Activando notificaciones…');
    try {
      this.startListeners();
      await this.subscribeWorker();
    } catch {
      this.toast.error('No se pudieron activar las notificaciones');
      return false;
    }
    this.setActive(true);
    this.toast.success('Notificaciones activadas');
    return true;
  }

  async disable(): Promise<void> {
    await this.fcm.unsubscribe();
    this.setActive(false);
    this.toast.info('Notificaciones desactivadas');
  }

  private setActive(value: boolean): void {
    this.active.set(value);
    localStorage.setItem(ACTIVE_KEY, value ? '1' : '0');
  }

  private async askPermission(): Promise<boolean> {
    const result = await Notification.requestPermission();
    this.permission.set(result as NotificationPermissionState);
    return result === 'granted';
  }

  private async subscribeWorker(): Promise<void> {
    const registration = await navigator.serviceWorker.register(FCM_SW_URL, { scope: FCM_SW_SCOPE });
    await this.fcm.subscribe(registration);
  }

  private startListeners(): void {
    if (this.listenersStarted) return;
    this.listenersStarted = true;
    this.fcm.onRegistered((token) => this.zone.run(() => void this.http.registerToken(token)));
    this.fcm.onUnregistered((token) => this.zone.run(() => void this.http.removeToken(token)));
    this.fcm.onForegroundMessage((payload) => this.zone.run(() => this.showForeground(payload)));
  }

  private showForeground(payload: MessagePayload): void {
    const title = payload.notification?.title ?? 'PetFinder';
    const body = payload.notification?.body ?? '';
    this.toast.info(body ? `${title}: ${body}` : title);
  }

  private readPermission(): NotificationPermissionState {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermissionState;
  }
}
