import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service';
import { FirebaseMessagingClient } from '../infrastructure/firebase-messaging.client';
import { NotificationHttp } from '../infrastructure/notification.http';
import { ToastService } from '../../../shared/application/toast.service';

describe('NotificationService', () => {
  let fcm: {
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
    onRegistered: ReturnType<typeof vi.fn>;
    onUnregistered: ReturnType<typeof vi.fn>;
    onForegroundMessage: ReturnType<typeof vi.fn>;
  };
  let http: { registerToken: ReturnType<typeof vi.fn>; removeToken: ReturnType<typeof vi.fn> };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let registerWorker: ReturnType<typeof vi.fn>;

  function stubBrowser(permission: string, supported = true): void {
    vi.stubGlobal(
      'Notification',
      supported ? { permission, requestPermission: vi.fn().mockResolvedValue(permission) } : undefined,
    );
    registerWorker = vi.fn().mockResolvedValue({} as ServiceWorkerRegistration);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: registerWorker },
      configurable: true,
    });
  }

  function createService(): NotificationService {
    fcm = {
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      onRegistered: vi.fn(),
      onUnregistered: vi.fn(),
      onForegroundMessage: vi.fn(),
    };
    http = { registerToken: vi.fn().mockResolvedValue(undefined), removeToken: vi.fn().mockResolvedValue(undefined) };
    toast = { success: vi.fn(), info: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: FirebaseMessagingClient, useValue: fcm },
        { provide: NotificationHttp, useValue: http },
        { provide: ToastService, useValue: toast },
      ],
    });
    return TestBed.inject(NotificationService);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('enable', () => {
    it('returns false and does not subscribe when notifications are unsupported', async () => {
      // Given: navegador sin soporte de notificaciones
      stubBrowser('default', false);
      const service = createService();

      // When: se intenta activar
      const result = await service.enable();

      // Then: no activa ni se suscribe
      expect(result).toBe(false);
      expect(fcm.subscribe).not.toHaveBeenCalled();
    });

    it('returns false when the user denies permission', async () => {
      // Given: el usuario rechaza el permiso
      stubBrowser('denied');
      const service = createService();

      // When
      const result = await service.enable();

      // Then
      expect(result).toBe(false);
      expect(fcm.subscribe).not.toHaveBeenCalled();
    });

    it('registers the worker, subscribes and confirms when permission is granted', async () => {
      // Given: el usuario acepta el permiso
      stubBrowser('granted');
      const service = createService();

      // When
      const result = await service.enable();

      // Then: registra el SW de FCM en su scope, se suscribe y avisa
      expect(result).toBe(true);
      expect(registerWorker).toHaveBeenCalledWith('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });
      expect(fcm.subscribe).toHaveBeenCalledOnce();
      expect(toast.success).toHaveBeenCalled();
    });

    it('returns false and warns when the push subscription fails', async () => {
      // Given: el navegador da permiso pero el push service rechaza la suscripción
      stubBrowser('granted');
      const service = createService();
      fcm.subscribe.mockRejectedValueOnce(new Error('push service error'));

      // When
      const result = await service.enable();

      // Then: no queda activa y avisa el error
      expect(result).toBe(false);
      expect(service.active()).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });

    it('sends the registered token to the back', async () => {
      // Given: activado, con un listener de registro en curso
      stubBrowser('granted');
      const service = createService();
      await service.enable();

      // When: FCM entrega un token
      const onRegistered = fcm.onRegistered.mock.calls[0][0] as (token: string) => void;
      onRegistered('fid-123');

      // Then: se manda al back
      expect(http.registerToken).toHaveBeenCalledWith('fid-123');
    });
  });

  describe('disable', () => {
    it('unsubscribes from FCM', async () => {
      // Given
      stubBrowser('granted');
      const service = createService();

      // When
      await service.disable();

      // Then
      expect(fcm.unsubscribe).toHaveBeenCalledOnce();
    });
  });

  describe('foreground messages', () => {
    it('shows a toast with the notification title and body', async () => {
      // Given: activado y escuchando mensajes en foreground
      stubBrowser('granted');
      const service = createService();
      await service.enable();
      const onMessage = fcm.onForegroundMessage.mock.calls[0][0] as (p: unknown) => void;

      // When: llega un mensaje con la app abierta
      onMessage({ notification: { title: 'Coincidencia', body: 'Cerca tuyo' } });

      // Then
      expect(toast.info).toHaveBeenCalledWith('Coincidencia: Cerca tuyo');
    });
  });
});
