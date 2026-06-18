import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  register as fcmRegister,
  unregister as fcmUnregister,
  onRegistered as fcmOnRegistered,
  onUnregistered as fcmOnUnregistered,
  onMessage as fcmOnMessage,
  Messaging,
  MessagePayload,
} from 'firebase/messaging';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseMessagingClient {
  private messaging?: Messaging;

  subscribe(registration: ServiceWorkerRegistration): Promise<void> {
    return fcmRegister(this.instance(), {
      vapidKey: environment.vapidKey,
      serviceWorkerRegistration: registration,
    });
  }

  unsubscribe(): Promise<void> {
    return fcmUnregister(this.instance());
  }

  onRegistered(handler: (token: string) => void): void {
    fcmOnRegistered(this.instance(), handler);
  }

  onUnregistered(handler: (token: string) => void): void {
    fcmOnUnregistered(this.instance(), handler);
  }

  onForegroundMessage(handler: (payload: MessagePayload) => void): void {
    fcmOnMessage(this.instance(), handler);
  }

  private instance(): Messaging {
    return (this.messaging ??= getMessaging(initializeApp(environment.firebase)));
  }
}
