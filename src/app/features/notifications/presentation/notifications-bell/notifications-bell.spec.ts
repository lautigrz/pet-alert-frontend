import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

import { NotificationsBell } from './notifications-bell';
import { NotificationsService } from '../../application/notifications.service';
import { NotificacionCoincidencia } from '../../domain/match-notification';

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

describe('NotificationsBell', () => {
  let component: NotificationsBell;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        NotificationsBell,
        {
          provide: NotificationsService,
          useValue: {
            notificaciones: signal<NotificacionCoincidencia[]>([]),
            noVistas: signal(0),
            escuchar: vi.fn(),
            cargar: vi.fn().mockResolvedValue(undefined),
            esNueva: vi.fn().mockReturnValue(true),
          },
        },
        { provide: Router, useValue: { navigate } },
      ],
    });

    component = TestBed.inject(NotificationsBell);
  });

  describe('rol dueño', () => {
    it('muestra la foto del avistamiento y navega a su reporte perdido', () => {
      const n = noti({ rol: 'dueno' });

      expect(component.imagenDe(n)).toBe('sight.jpg');

      component.goToMatches(n);

      expect(navigate).toHaveBeenCalledWith(['/reports', 'lost-1', 'matches']);
    });
  });

  describe('rol avistador', () => {
    it('muestra la foto de la mascota perdida y navega a su propio avistamiento', () => {
      const n = noti({ rol: 'avistador' });

      expect(component.imagenDe(n)).toBe('lost.jpg');
      expect(component.tituloDe(n)).toContain('avistamiento');

      component.goToMatches(n);

      expect(navigate).toHaveBeenCalledWith(['/reports', 'sight-1', 'matches']);
    });
  });
});
