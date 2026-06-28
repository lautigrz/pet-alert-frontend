import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';

import { NotificationsService } from './notifications.service';
import { SocketService } from '../../../core/services/socket.service';
import { SeenMatchesStore } from '../../report/application/seen-matches.store';
import { NotificationsHttp } from '../infrastructure/notifications.http';
import { MatchNotification } from '../domain/match-notification';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let socketServiceMock: { on: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn> };
  let notificationsHttpMock: { getMine: ReturnType<typeof vi.fn> };
  let seenMatchesStoreMock: {
    ensureLoaded: ReturnType<typeof vi.fn>;
    isNew: ReturnType<typeof vi.fn>;
    markSeen: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  };
  let seenSet: Set<string>;
  let matchStream: Subject<MatchNotification>;

  const unMatch = (overrides: Partial<MatchNotification> = {}): MatchNotification => ({
    ownerPublicId: 'owner-1',
    rol: 'dueno',
    lostReportPublicId: 'lost-1',
    lostPetName: 'Mandarina',
    lostPetImage: null,
    matchPublicId: 'match-1',
    matchedReportPublicId: 'sighting-1',
    matchedImage: 'https://img/1.jpg',
    score: 0.87,
    createdAt: '2026-06-19T18:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    matchStream = new Subject<MatchNotification>();
    socketServiceMock = { on: vi.fn().mockReturnValue(matchStream), emit: vi.fn() };
    notificationsHttpMock = { getMine: vi.fn().mockResolvedValue([]) };

    seenSet = new Set<string>();
    seenMatchesStoreMock = {
      ensureLoaded: vi.fn().mockResolvedValue(undefined),
      isNew: vi.fn((id: string) => !seenSet.has(id)),
      markSeen: vi.fn(async (id: string) => {
        seenSet.add(id);
      }),
      reset: vi.fn(() => {
        seenSet.clear();
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        { provide: SocketService, useValue: socketServiceMock },
        { provide: NotificationsHttp, useValue: notificationsHttpMock },
        { provide: SeenMatchesStore, useValue: seenMatchesStoreMock },
      ],
    });

    service = TestBed.inject(NotificationsService);
  });

  it('se suscribe al evento match:new al escuchar', () => {
    service.escuchar();
    expect(socketServiceMock.on).toHaveBeenCalledWith('match:new');
  });

  it('cuenta como no vista una coincidencia que no esta en el store', () => {
    service.escuchar();
    matchStream.next(unMatch());

    expect(service.notificaciones().length).toBe(1);
    expect(service.noVistas()).toBe(1);
  });

  it('no duplica notificaciones con el mismo matchPublicId', () => {
    service.escuchar();
    matchStream.next(unMatch());
    matchStream.next(unMatch());

    expect(service.notificaciones().length).toBe(1);
  });

  it('esNueva delega en el store de vistas', () => {
    seenSet.add('match-1');

    expect(service.esNueva('match-1')).toBe(false);
    expect(service.esNueva('match-2')).toBe(true);
  });

  it('escuchar es idempotente: una sola suscripcion', () => {
    service.escuchar();
    service.escuchar();

    expect(socketServiceMock.on).toHaveBeenCalledTimes(1);
  });

  it('clear vacia las notificaciones en memoria y resetea el store de vistas', () => {
    service.escuchar();
    matchStream.next(unMatch());
    expect(service.notificaciones().length).toBe(1);

    service.clear();

    expect(service.notificaciones().length).toBe(0);
    expect(service.noVistas()).toBe(0);
    expect(seenMatchesStoreMock.reset).toHaveBeenCalled();
  });

  it('cargar trae las notificaciones del back y consulta las vistas del server', async () => {
    notificationsHttpMock.getMine.mockResolvedValue([unMatch()]);

    await service.cargar();

    expect(notificationsHttpMock.getMine).toHaveBeenCalled();
    expect(seenMatchesStoreMock.ensureLoaded).toHaveBeenCalled();
    expect(service.notificaciones().length).toBe(1);
    expect(service.noVistas()).toBe(1);
  });

  it('no cuenta como nuevas las coincidencias ya vistas en el server (cross-device)', async () => {
    seenSet.add('match-1');
    notificationsHttpMock.getMine.mockResolvedValue([unMatch()]);

    await service.cargar();

    expect(service.notificaciones().length).toBe(1);
    expect(service.noVistas()).toBe(0);
  });

  it('cargar es idempotente: una sola llamada al back', async () => {
    notificationsHttpMock.getMine.mockResolvedValue([]);

    await service.cargar();
    await service.cargar();

    expect(notificationsHttpMock.getMine).toHaveBeenCalledTimes(1);
  });

  it('despues de clear, cargar vuelve a pedir al back (relogin)', async () => {
    notificationsHttpMock.getMine.mockResolvedValue([unMatch()]);

    await service.cargar();
    service.clear();
    await service.cargar();

    expect(notificationsHttpMock.getMine).toHaveBeenCalledTimes(2);
    expect(service.notificaciones().length).toBe(1);
  });
});
