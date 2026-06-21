import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MatchService } from './match.service';
import { MatchHttp, MatchResult } from '../infrastructure/match.http';
import { ReportService } from './report.service';
import { ReportDetail } from '../infrastructure/report.http';
import { NotificationsHttp } from '../../notifications/infrastructure/notifications.http';
import { MatchNotification } from '../../notifications/domain/match-notification';

function makeReportDetail(overrides: Partial<ReportDetail> = {}): ReportDetail {
  return {
    publicId: 'report-uuid-1',
    type: 'SIGHTING',
    status: 'ACTIVE',
    description: 'desc',
    createdAt: '2024-01-01T00:00:00.000Z',
    occurredAt: '2024-01-01T10:00:00.000Z',
    updatedAt: null,
    location: { address: 'Calle 1', latitude: 0, longitude: 0 },
    details: { animalType: 'DOG', color: 'negro', hasIdCollar: false, isInTransit: false, images: [] },
    user: { publicId: 'user-uuid', username: 'test', photoUrl: null },
    ...overrides,
  };
}

function makeMatchResult(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    publicId: 'match-1',
    sourceReportPublicId: 'src',
    score: 0.9,
    details: { publicId: 'cand-1', images: ['fallback.jpg'], animalType: 'cat' },
    ...overrides,
  };
}

function makeNotification(overrides: Partial<MatchNotification> = {}): MatchNotification {
  return {
    ownerPublicId: 'owner',
    lostReportPublicId: 'lost',
    lostPetName: 'pupo',
    matchPublicId: 'notif-1',
    matchedReportPublicId: 'sighting',
    matchedImage: null,
    score: 0.5,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('MatchService', () => {
  let matchHttp: { getByReport: ReturnType<typeof vi.fn> };
  let notificationsHttp: { getMine: ReturnType<typeof vi.fn> };
  let reportService: { getReportByPublicId: ReturnType<typeof vi.fn> };
  let service: MatchService;

  beforeEach(() => {
    matchHttp = { getByReport: vi.fn().mockResolvedValue([]) };
    notificationsHttp = { getMine: vi.fn().mockResolvedValue([]) };
    reportService = { getReportByPublicId: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        MatchService,
        { provide: MatchHttp, useValue: matchHttp },
        { provide: NotificationsHttp, useValue: notificationsHttp },
        { provide: ReportService, useValue: reportService },
      ],
    });

    service = TestBed.inject(MatchService);
  });

  function stubReports(reports: Record<string, ReportDetail>): void {
    reportService.getReportByPublicId.mockImplementation((id: string) => {
      const found = reports[id];
      return found ? Promise.resolve(found) : Promise.reject(new Error('not found'));
    });
  }

  it('mapea una coincidencia con nombre, imagen, usuario y distancia', async () => {
    const source = makeReportDetail({
      publicId: 'src',
      user: { publicId: 'me', username: 'yo', photoUrl: null },
      location: { address: '', latitude: 0, longitude: 0 },
    });
    const candidate = makeReportDetail({
      publicId: 'cand-1',
      user: { publicId: 'other', username: 'ana', photoUrl: null },
      location: { address: '', latitude: 0, longitude: 1 },
      details: { animalType: 'CAT', color: '', hasIdCollar: false, isInTransit: false, images: [{ url: 'detail.jpg' }], petName: 'Michi' },
    });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', score: 0.87, details: { publicId: 'cand-1', images: ['fallback.jpg'], animalType: 'cat' } }),
    ]);
    stubReports({ src: source, 'cand-1': candidate });

    const { matches } = await service.getReportMatches('src');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      reportPublicId: 'cand-1',
      userPublicId: 'other',
      name: 'Gato avistado',
      image: 'detail.jpg',
      username: 'ana',
      score: 0.87,
    });
    expect(matches[0].distanceKm).toBe(111.2);
  });

  it('arma el título según el tipo de reporte y el animal', async () => {
    const source = makeReportDetail({ publicId: 'src', user: { publicId: 'me', username: 'yo', photoUrl: null } });
    const perdido = makeReportDetail({
      publicId: 'c1',
      type: 'LOST',
      user: { publicId: 'o1', username: 'a', photoUrl: null },
      details: { animalType: 'DOG', color: '', hasIdCollar: false, images: [] },
    });
    const transito = makeReportDetail({
      publicId: 'c2',
      type: 'SIGHTING',
      user: { publicId: 'o2', username: 'b', photoUrl: null },
      details: { animalType: 'CAT', color: '', hasIdCollar: false, isInTransit: true, images: [] },
    });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', score: 0.9, details: { publicId: 'c1', images: [], animalType: 'dog' } }),
      makeMatchResult({ publicId: 'm2', score: 0.8, details: { publicId: 'c2', images: [], animalType: 'cat' } }),
    ]);
    stubReports({ src: source, c1: perdido, c2: transito });

    const { matches } = await service.getReportMatches('src');

    const titulos = new Map(matches.map((m) => [m.reportPublicId, m.name]));
    expect(titulos.get('c1')).toBe('Perro perdido');
    expect(titulos.get('c2')).toBe('Gato en tránsito');
  });

  it('combina el lado source con las notificaciones bidireccionales y ordena por score', async () => {
    const lost = makeReportDetail({ publicId: 'lost', type: 'LOST', user: { publicId: 'franco', username: 'fran', photoUrl: null } });
    const r1 = makeReportDetail({ publicId: 'r1', user: { publicId: 'nicki', username: 'nicki', photoUrl: null } });
    const r4 = makeReportDetail({ publicId: 'r4', user: { publicId: 'nicki', username: 'nicki', photoUrl: null } });
    const r5 = makeReportDetail({ publicId: 'r5', user: { publicId: 'nicki', username: 'nicki', photoUrl: null } });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', score: 0.76, details: { publicId: 'r1', images: [], animalType: 'dog' } }),
    ]);
    notificationsHttp.getMine.mockResolvedValue([
      makeNotification({ lostReportPublicId: 'lost', matchedReportPublicId: 'r1', score: 0.76 }),
      makeNotification({ lostReportPublicId: 'lost', matchedReportPublicId: 'r4', score: 0.6 }),
      makeNotification({ lostReportPublicId: 'lost', matchedReportPublicId: 'r5', score: 0.55 }),
    ]);
    stubReports({ lost, r1, r4, r5 });

    const { matches } = await service.getReportMatches('lost');

    expect(matches.map((m) => m.reportPublicId)).toEqual(['r1', 'r4', 'r5']);
    expect(matches[0].score).toBe(0.76);
  });

  it('deduplica un candidato repetido sin alterar el score del back', async () => {
    const source = makeReportDetail({ publicId: 'src', user: { publicId: 'me', username: 'yo', photoUrl: null } });
    const candidate = makeReportDetail({ publicId: 'cand', user: { publicId: 'other', username: 'ana', photoUrl: null } });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', score: 0.5, details: { publicId: 'cand', images: [], animalType: 'dog' } }),
    ]);
    notificationsHttp.getMine.mockResolvedValue([
      makeNotification({ lostReportPublicId: 'src', matchedReportPublicId: 'cand', score: 0.76 }),
    ]);
    stubReports({ src: source, cand: candidate });

    const { matches } = await service.getReportMatches('src');

    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBe(0.5);
  });

  it('excluye coincidencias que son reportes del propio dueño', async () => {
    const source = makeReportDetail({ publicId: 'src', user: { publicId: 'me', username: 'yo', photoUrl: null } });
    const mine = makeReportDetail({ publicId: 'cand-mine', user: { publicId: 'me', username: 'yo', photoUrl: null } });
    const other = makeReportDetail({ publicId: 'cand-other', user: { publicId: 'other', username: 'ana', photoUrl: null } });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', details: { publicId: 'cand-mine', images: [], animalType: 'dog' } }),
      makeMatchResult({ publicId: 'm2', details: { publicId: 'cand-other', images: [], animalType: 'dog' } }),
    ]);
    stubReports({ src: source, 'cand-mine': mine, 'cand-other': other });

    const { matches } = await service.getReportMatches('src');

    expect(matches.map((m) => m.reportPublicId)).toEqual(['cand-other']);
  });

  it('usa la imagen del endpoint y nombre por defecto cuando no carga el detalle', async () => {
    const source = makeReportDetail({ publicId: 'src', user: { publicId: 'me', username: 'yo', photoUrl: null } });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', details: { publicId: 'cand-x', images: ['fallback.jpg'], animalType: 'cat' } }),
    ]);
    reportService.getReportByPublicId.mockImplementation((id: string) =>
      id === 'src' ? Promise.resolve(source) : Promise.reject(new Error('not found')),
    );

    const { matches } = await service.getReportMatches('src');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      name: 'Coincidencia',
      image: 'fallback.jpg',
      username: '',
      userPublicId: '',
      distanceKm: null,
    });
  });

  it('cae al lado source cuando fallan las notificaciones', async () => {
    const source = makeReportDetail({ publicId: 'src', user: { publicId: 'me', username: 'yo', photoUrl: null } });
    const candidate = makeReportDetail({ publicId: 'cand', user: { publicId: 'other', username: 'ana', photoUrl: null } });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', score: 0.6, details: { publicId: 'cand', images: [], animalType: 'dog' } }),
    ]);
    notificationsHttp.getMine.mockRejectedValue(new Error('401'));
    stubReports({ src: source, cand: candidate });

    const { matches } = await service.getReportMatches('src');

    expect(matches.map((m) => m.reportPublicId)).toEqual(['cand']);
  });

  it('excluye coincidencias con score menor al 50%', async () => {
    const source = makeReportDetail({ publicId: 'src', user: { publicId: 'me', username: 'yo', photoUrl: null } });
    const low = makeReportDetail({ publicId: 'cand-low', user: { publicId: 'other', username: 'ana', photoUrl: null } });
    const high = makeReportDetail({ publicId: 'cand-high', user: { publicId: 'other2', username: 'eva', photoUrl: null } });

    matchHttp.getByReport.mockResolvedValue([
      makeMatchResult({ publicId: 'm1', score: 0.49, details: { publicId: 'cand-low', images: [], animalType: 'dog' } }),
      makeMatchResult({ publicId: 'm2', score: 0.5, details: { publicId: 'cand-high', images: [], animalType: 'dog' } }),
    ]);
    stubReports({ src: source, 'cand-low': low, 'cand-high': high });

    const { matches } = await service.getReportMatches('src');

    expect(matches.map((m) => m.reportPublicId)).toEqual(['cand-high']);
  });

  it('retorna lista vacía cuando no hay coincidencias', async () => {
    const source = makeReportDetail({ publicId: 'src', user: { publicId: 'me', username: 'yo', photoUrl: null } });
    matchHttp.getByReport.mockResolvedValue([]);
    stubReports({ src: source });

    const { matches } = await service.getReportMatches('src');

    expect(matches).toEqual([]);
  });
});
