import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';

import { SocketService } from '../../../core/services/socket.service';
import { NotificationHttp } from '../infrastructure/notification.http';
import { LostNearbyNotificationsService } from './lost-nearby-notifications.service';
import {
  LOST_NEARBY_EVENT,
  LostNearbySocketNotification,
} from '../domain/lost-nearby-notification';

describe('LostNearbyNotificationsService', () => {
  let socket: {
    on: ReturnType<typeof vi.fn>;
  };

  let http: {
    getLostNearby: ReturnType<typeof vi.fn>;
    markLostNearbyAsSeen: ReturnType<typeof vi.fn>;
  };

  let events: Subject<LostNearbySocketNotification>;

  function createService(): LostNearbyNotificationsService {
    events = new Subject<LostNearbySocketNotification>();

    socket = {
      on: vi.fn().mockReturnValue(events),
    };

    http = {
      getLostNearby: vi.fn().mockResolvedValue([]),
      markLostNearbyAsSeen: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        LostNearbyNotificationsService,
        { provide: SocketService, useValue: socket },
        { provide: NotificationHttp, useValue: http },
      ],
    });

    return TestBed.inject(LostNearbyNotificationsService);
  }

  function notification(
    overrides: Partial<LostNearbySocketNotification> = {},
  ): LostNearbySocketNotification {
    return {
      userPublicId: 'user-1',
      notificationPublicId: 'notification-1',
      reportPublicId: 'report-1',
      petName: 'Firulais',
      reportImage: 'image.jpg',
      reportAddress: 'Av. Siempre Viva 123',
      title: 'Nueva mascota perdida',
      body: 'Hay una mascota perdida cerca tuyo.',
      seen: false,
      createdAt: '2026-07-10T10:00:00.000Z',
      ...overrides,
    };
  }
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('escuchar', () => {
    it('subscribes to the lost nearby socket event', () => {
      // Given
      const service = createService();

      // When
      service.escuchar();

      // Then
      expect(socket.on).toHaveBeenCalledOnce();
      expect(socket.on).toHaveBeenCalledWith(LOST_NEARBY_EVENT);
    });

    it('does not subscribe twice', () => {
      // Given
      const service = createService();

      // When
      service.escuchar();
      service.escuchar();

      // Then
      expect(socket.on).toHaveBeenCalledOnce();
    });
  });

  describe('load', () => {
    it('loads notifications from the backend', async () => {
      // Given
      const service = createService();
      const remote = [notification()];

      http.getLostNearby.mockResolvedValueOnce(remote);

      // When
      await service.load();

      // Then
      expect(http.getLostNearby).toHaveBeenCalledOnce();
      expect(service.notifications()).toEqual(remote);
      expect(service.unreadCount()).toBe(1);
    });

    it('does not load notifications twice', async () => {
      // Given
      const service = createService();

      http.getLostNearby.mockResolvedValueOnce([notification()]);

      // When
      await service.load();
      await service.load();

      // Then
      expect(http.getLostNearby).toHaveBeenCalledOnce();
    });

    it('allows retrying after a failed load', async () => {
      // Given
      const service = createService();

      http.getLostNearby
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([notification()]);

      // When
      await service.load();
      await service.load();

      // Then
      expect(http.getLostNearby).toHaveBeenCalledTimes(2);
      expect(service.notifications()).toEqual([notification()]);
      expect(service.unreadCount()).toBe(1);
    });
  });

  describe('markAsSeen', () => {
    it('marks a notification as seen', async () => {
      // Given
      const service = createService();

      const remote = [
        notification({
          notificationPublicId: 'notification-1',
          seen: false,
        }),
      ];

      http.getLostNearby.mockResolvedValueOnce(remote);

      await service.load();

      // When
      await service.markAsSeen('notification-1');

      // Then
      expect(http.markLostNearbyAsSeen).toHaveBeenCalledOnce();
      expect(http.markLostNearbyAsSeen).toHaveBeenCalledWith('notification-1');

      expect(service.notifications()).toEqual([
        {
          ...remote[0],
          seen: true,
        },
      ]);

      expect(service.unreadCount()).toBe(0);
    });

    it('does not modify other notifications', async () => {
      // Given
      const service = createService();

      const first = notification({
        notificationPublicId: 'notification-1',
        seen: false,
      });

      const second = notification({
        notificationPublicId: 'notification-2',
        seen: false,
        createdAt: '2026-07-10T09:00:00.000Z',
      });

      http.getLostNearby.mockResolvedValueOnce([first, second]);

      await service.load();

      // When
      await service.markAsSeen('notification-1');

      // Then
      expect(service.notifications()).toEqual([
        {
          ...first,
          seen: true,
        },
        second,
      ]);

      expect(service.unreadCount()).toBe(1);
    });
  });
  describe('clear', () => {
    it('clears notifications and allows loading again', async () => {
      // Given
      const service = createService();

      http.getLostNearby.mockResolvedValueOnce([notification()]).mockResolvedValueOnce([]);

      await service.load();

      expect(service.notifications()).toHaveLength(1);

      // When
      service.clear();

      await service.load();

      // Then
      expect(service.notifications()).toEqual([]);
      expect(service.unreadCount()).toBe(0);
      expect(http.getLostNearby).toHaveBeenCalledTimes(2);
    });
  });

  describe('incoming notifications', () => {
    it('adds a notification received from the socket', () => {
      // Given
      const service = createService();

      service.escuchar();

      const incoming = notification({
        notificationPublicId: 'notification-1',
        seen: false,
      });

      // When
      events.next(incoming);

      // Then
      expect(service.notifications()).toEqual([incoming]);
      expect(service.unreadCount()).toBe(1);
    });

    it('ignores duplicated notifications', () => {
      // Given
      const service = createService();

      service.escuchar();

      const incoming = notification({
        notificationPublicId: 'notification-1',
      });

      // When
      events.next(incoming);
      events.next(incoming);

      // Then
      expect(service.notifications()).toEqual([incoming]);
      expect(service.notifications()).toHaveLength(1);
      expect(service.unreadCount()).toBe(1);
    });
  });

  describe('load and socket integration', () => {
    it('keeps a single notification when the same notification is received from the socket and the backend', async () => {
      // Given
      const service = createService();

      service.escuchar();

      const incoming = notification({
        notificationPublicId: 'notification-1',
      });

      events.next(incoming);

      http.getLostNearby.mockResolvedValueOnce([incoming]);

      // When
      await service.load();

      // Then
      expect(service.notifications()).toEqual([incoming]);
      expect(service.notifications()).toHaveLength(1);
    });
  });
});
