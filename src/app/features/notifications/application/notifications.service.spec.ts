import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';

import { NotificationsService } from './notifications.service';
import { SocketService } from '../../../core/services/socket.service';
import { TokenStorage } from '../../auth/infrastructure/token.storage';
import { NotificationsHttp } from '../infrastructure/notifications.http';
import { MatchNotification } from '../domain/match-notification';

const STORAGE_KEY = 'petfinder.matchNotifications';

function tokenFor(sub: string): string {
  return `header.${btoa(JSON.stringify({ sub }))}.signature`;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let socketServiceMock: { on: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn> };
  let notificationsHttpMock: { getMine: ReturnType<typeof vi.fn> };
  let tokenStorageMock: { read: ReturnType<typeof vi.fn> };
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
    localStorage.clear();
    matchStream = new Subject<MatchNotification>();
    socketServiceMock = { on: vi.fn().mockReturnValue(matchStream), emit: vi.fn() };
    notificationsHttpMock = { getMine: vi.fn().mockResolvedValue([]) };
    tokenStorageMock = { read: vi.fn().mockReturnValue(null) };

    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        { provide: SocketService, useValue: socketServiceMock },
        { provide: NotificationsHttp, useValue: notificationsHttpMock },
        { provide: TokenStorage, useValue: tokenStorageMock },
      ],
    });

    service = TestBed.inject(NotificationsService);
  });

  it('se suscribe al evento match:new al escuchar', () => {
    service.escuchar();
    expect(socketServiceMock.on).toHaveBeenCalledWith('match:new');
  });

  it('agrega una notificacion no vista cuando llega un match', () => {
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

  it('marca una notificacion como vista y baja el contador', () => {
    service.escuchar();
    matchStream.next(unMatch());

    service.marcarVista('match-1');

    expect(service.noVistas()).toBe(0);
    expect(service.notificaciones()[0].vista).toBe(true);
  });

  it('escuchar es idempotente: una sola suscripcion', () => {
    service.escuchar();
    service.escuchar();

    expect(socketServiceMock.on).toHaveBeenCalledTimes(1);
  });

  it('persiste las notificaciones en localStorage', () => {
    service.escuchar();
    matchStream.next(unMatch());

    expect(localStorage.getItem(STORAGE_KEY)).toContain('match-1');
  });

  it('clear resetea la vista en memoria pero conserva el localStorage', () => {
    service.escuchar();
    matchStream.next(unMatch());
    expect(service.notificaciones().length).toBe(1);

    service.clear();

    expect(service.notificaciones().length).toBe(0);
    expect(service.noVistas()).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('match-1');
  });

  it('preserva el estado vista al cerrar sesion y volver a entrar (per-user)', async () => {
    tokenStorageMock.read.mockReturnValue({ accessToken: tokenFor('user-1'), refreshToken: 'r' });

    service.escuchar();
    matchStream.next(unMatch());
    service.marcarVista('match-1');
    expect(service.noVistas()).toBe(0);

    service.clear();
    expect(service.notificaciones().length).toBe(0);

    notificationsHttpMock.getMine.mockResolvedValue([unMatch()]);
    await service.cargar();

    expect(service.notificaciones().length).toBe(1);
    expect(service.notificaciones()[0].vista).toBe(true);
    expect(service.noVistas()).toBe(0);
    expect(localStorage.getItem(`${STORAGE_KEY}.user-1`)).toContain('match-1');
  });

  it('rehidrata las notificaciones desde localStorage al iniciar', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...unMatch(), vista: false }]));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        { provide: SocketService, useValue: socketServiceMock },
        { provide: NotificationsHttp, useValue: notificationsHttpMock },
        { provide: TokenStorage, useValue: tokenStorageMock },
      ],
    });
    const rehidratado = TestBed.inject(NotificationsService);

    expect(rehidratado.notificaciones().length).toBe(1);
    expect(rehidratado.noVistas()).toBe(1);
  });

  it('cargar trae las notificaciones del back y las fusiona', async () => {
    notificationsHttpMock.getMine.mockResolvedValue([unMatch()]);

    await service.cargar();

    expect(notificationsHttpMock.getMine).toHaveBeenCalled();
    expect(service.notificaciones().length).toBe(1);
    expect(service.noVistas()).toBe(1);
  });

  it('cargar preserva el estado vista de una notificacion ya existente y no la duplica', async () => {
    service.escuchar();
    matchStream.next(unMatch());
    service.marcarVista('match-1');
    notificationsHttpMock.getMine.mockResolvedValue([unMatch()]);

    await service.cargar();

    expect(service.notificaciones().length).toBe(1);
    expect(service.notificaciones()[0].vista).toBe(true);
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
