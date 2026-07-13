import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

import { NotificationsBell } from './notifications-bell';
import { NotificationsService } from '../../application/notifications.service';
import { LostNearbyNotificationsService } from '../../application/lost-nearby-notifications.service';
import { NotificacionCoincidencia } from '../../domain/match-notification';
import { LostNearbyNotification } from '../../domain/lost-nearby-notification';

function noti(overrides: Partial<NotificacionCoincidencia> = {}): NotificacionCoincidencia {
  return {
    ownerPublicId: 'u',
    rol: 'dueno',
    lostReportPublicId: 'lost-1',
    lostPetName: 'naranja',
    lostPetImage: 'lost.jpg',
    matchPublicId: 'm1',
    matchedReportPublicId: 'sight-1',
    matchedImage: 'sight.jpg',
    score: 0.8,
    createdAt: '2026-06-20T10:00:00.000Z',
    ...overrides,
  };
}

function lostNearby(overrides: Partial<LostNearbyNotification> = {}): LostNearbyNotification {
  return {
    userPublicId: 'user-1',
    notificationPublicId: 'notification-1',
    reportPublicId: 'report-1',
    petName: 'Firulais',
    reportImage: 'dog.jpg',
    reportAddress: 'Siempre Viva 123',
    title: 'Nueva mascota perdida',
    body: 'Hay una mascota perdida cerca tuyo',
    seen: false,
    createdAt: '2026-07-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('NotificationsBell', () => {
  let component: NotificationsBell;
  let navigate: ReturnType<typeof vi.fn>;

  let notificationsService: {
    notificaciones: ReturnType<typeof signal<NotificacionCoincidencia[]>>;
    noVistas: ReturnType<typeof signal<number>>;
    escuchar: ReturnType<typeof vi.fn>;
    cargar: ReturnType<typeof vi.fn>;
    esNueva: ReturnType<typeof vi.fn>;
    markSeen: ReturnType<typeof vi.fn>;
  };

  let lostNearbyNotificationsService: {
    notifications: ReturnType<typeof signal<LostNearbyNotification[]>>;
    unreadCount: ReturnType<typeof signal<number>>;
    escuchar: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    markAsSeen: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    navigate = vi.fn();

    notificationsService = {
      notificaciones: signal<NotificacionCoincidencia[]>([]),
      noVistas: signal(0),
      escuchar: vi.fn(),
      cargar: vi.fn().mockResolvedValue(undefined),
      esNueva: vi.fn().mockReturnValue(true),
      markSeen: vi.fn().mockResolvedValue(undefined),
    };

    lostNearbyNotificationsService = {
      notifications: signal<LostNearbyNotification[]>([]),
      unreadCount: signal(0),
      escuchar: vi.fn(),
      load: vi.fn().mockResolvedValue(undefined),
      markAsSeen: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationsBell,
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: LostNearbyNotificationsService,
          useValue: lostNearbyNotificationsService,
        },
        {
          provide: Router,
          useValue: { navigate },
        },
      ],
    });

    component = TestBed.inject(NotificationsBell);
  });

  describe('rol dueño', () => {
    it('muestra la foto del avistamiento y navega a su reporte perdido', async () => {
      // Given
      const n = noti({ rol: 'dueno' });

      // Then
      expect(component.imagenDe(n)).toBe('sight.jpg');

      // When
      await component.goToMatches(n);

      // Then
      expect(navigate).toHaveBeenCalledWith(['/reports', 'lost-1', 'matches']);
    });
  });

  describe('rol avistador', () => {
    it('muestra la foto de la mascota perdida y navega a su propio avistamiento', async () => {
      // Given
      const n = noti({ rol: 'avistador' });

      // Then
      expect(component.imagenDe(n)).toBe('lost.jpg');
      expect(component.tituloDe(n)).toContain('avistamiento');

      // When
      await component.goToMatches(n);

      // Then
      expect(navigate).toHaveBeenCalledWith(['/reports', 'sight-1', 'matches']);
    });
  });

  describe('ngOnInit', () => {
    it('starts listening and loads both notification sources', () => {
      // Given
      expect(notificationsService.escuchar).not.toHaveBeenCalled();
      expect(notificationsService.cargar).not.toHaveBeenCalled();

      expect(lostNearbyNotificationsService.escuchar).not.toHaveBeenCalled();
      expect(lostNearbyNotificationsService.load).not.toHaveBeenCalled();

      // When
      component.ngOnInit();

      // Then
      expect(notificationsService.escuchar).toHaveBeenCalledOnce();
      expect(notificationsService.cargar).toHaveBeenCalledOnce();

      expect(lostNearbyNotificationsService.escuchar).toHaveBeenCalledOnce();
      expect(lostNearbyNotificationsService.load).toHaveBeenCalledOnce();
    });
  });

  describe('badge', () => {
    it('adds unread notifications from both services', () => {
      // Given
      notificationsService.noVistas.set(2);

      lostNearbyNotificationsService.notifications.set([
        lostNearby({
          notificationPublicId: '1',
          seen: false,
        }),
        lostNearby({
          notificationPublicId: '2',
          seen: false,
        }),
        lostNearby({
          notificationPublicId: '3',
          seen: true,
        }),
      ]);

      // Then
      expect(component.noVistas()).toBe(4);
      expect(component.badge()).toBe('4');
    });

    it('shows +10 when there are more than ten unread notifications', () => {
      // Given
      notificationsService.noVistas.set(8);

      lostNearbyNotificationsService.notifications.set([
        lostNearby({
          notificationPublicId: '1',
          seen: false,
        }),
        lostNearby({
          notificationPublicId: '2',
          seen: false,
        }),
        lostNearby({
          notificationPublicId: '3',
          seen: false,
        }),
      ]);

      // Then
      expect(component.noVistas()).toBe(11);
      expect(component.badge()).toBe('+10');
    });
  });

  describe('notificaciones', () => {
    it('combines match and lost nearby notifications', () => {
      // Given
      notificationsService.notificaciones.set([
        noti({
          matchPublicId: 'match-1',
        }),
      ]);

      lostNearbyNotificationsService.notifications.set([
        lostNearby({
          notificationPublicId: 'lost-1',
        }),
      ]);

      // Then
      expect(component.notificaciones()).toHaveLength(2);
    });

    it('sorts notifications by creation date', () => {
      // Given
      const older = noti({
        createdAt: '2026-06-20T10:00:00.000Z',
      });

      const newer = lostNearby({
        notificationPublicId: 'lost-1',
        createdAt: '2026-07-20T10:00:00.000Z',
      });

      notificationsService.notificaciones.set([older]);
      lostNearbyNotificationsService.notifications.set([newer]);

      // When
      const result = component.notificaciones();

      // Then
      expect(result[0]).toEqual(newer);
      expect(result[1]).toEqual(older);
    });
  });
  describe('goToLostReport', () => {
    it('marks an unseen notification as seen and navigates to the report', async () => {
      // Given
      component.abierto.set(true);

      const notification = lostNearby({
        notificationPublicId: 'notification-1',
        reportPublicId: 'report-1',
        seen: false,
      });

      // When
      await component.goToLostReport(notification);

      // Then
      expect(lostNearbyNotificationsService.markAsSeen).toHaveBeenCalledOnce();

      expect(lostNearbyNotificationsService.markAsSeen).toHaveBeenCalledWith('notification-1');

      expect(component.abierto()).toBe(false);

      expect(navigate).toHaveBeenCalledWith(['/reports', 'report-1']);
    });

    it('does not mark an already seen notification', async () => {
      // Given
      component.abierto.set(true);

      const notification = lostNearby({
        notificationPublicId: 'notification-1',
        reportPublicId: 'report-1',
        seen: true,
      });

      // When
      await component.goToLostReport(notification);

      // Then
      expect(lostNearbyNotificationsService.markAsSeen).not.toHaveBeenCalled();

      expect(component.abierto()).toBe(false);

      expect(navigate).toHaveBeenCalledWith(['/reports', 'report-1']);
    });
  });

  describe('type guards', () => {
    it('identifies a match notification', () => {
      // Given
      const match = noti();

      // Then
      expect(component.esMatch(match)).toBe(true);
      expect(component.esLostNearby(match)).toBe(false);
    });

    it('identifies a lost nearby notification', () => {
      // Given
      const notification = lostNearby();

      // Then
      expect(component.esLostNearby(notification)).toBe(true);
      expect(component.esMatch(notification)).toBe(false);
    });
  });

  describe('panelClase', () => {
    it('returns navbar classes by default', () => {
      // Given
      component.variante = 'navbar';

      // When
      const classes = component.panelClase();

      // Then
      expect(classes).toContain('fixed');
      expect(classes).toContain('md:absolute');
    });

    it('returns bottom classes', () => {
      // Given
      component.variante = 'bottom';

      // When
      const classes = component.panelClase();

      // Then
      expect(classes).toContain('absolute');
      expect(classes).toContain('bottom-[calc(100%+14px)]');
    });
  });

  describe('disparadorClase', () => {
    it('returns navbar trigger classes', () => {
      // Given
      component.variante = 'navbar';

      // When
      const classes = component.disparadorClase();

      // Then
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('w-9');
    });

    it('returns bottom trigger classes', () => {
      // Given
      component.variante = 'bottom';

      // When
      const classes = component.disparadorClase();

      // Then
      expect(classes).toContain('flex-col');
      expect(classes).toContain('text-[11px]');
    });
  });
});
