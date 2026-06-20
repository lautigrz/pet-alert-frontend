import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MatchesPage } from './matches';
import { MatchService } from '../../application/match.service';
import { ChatsService } from '../../../chats/application/chats.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { SeenMatchesStore } from '../../application/seen-matches.store';
import { ReportDetail } from '../../infrastructure/report.http';
import { Match } from '../../domain/match.model';

function makeReportDetail(overrides: Partial<ReportDetail> = {}): ReportDetail {
  return {
    publicId: 'src',
    type: 'LOST',
    status: 'ACTIVE',
    description: 'desc',
    createdAt: '2024-01-01T00:00:00.000Z',
    occurredAt: '2024-01-01T10:00:00.000Z',
    updatedAt: null,
    location: { address: 'Calle 1', latitude: 0, longitude: 0 },
    details: { name: 'Toby', animalType: 'DOG', color: 'negro', hasIdCollar: false, images: [] },
    user: { publicId: 'me', username: 'yo', photoUrl: null },
    ...overrides,
  };
}

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    matchPublicId: 'm1',
    reportPublicId: 'r1',
    userPublicId: 'owner-1',
    name: 'Michi',
    image: 'img.jpg',
    username: 'ana',
    foundAt: '2024-01-01T10:00:00.000Z',
    distanceKm: 2.1,
    score: 0.9,
    ...overrides,
  };
}

describe('MatchesPage', () => {
  let fixture: ComponentFixture<MatchesPage>;
  let component: MatchesPage;
  let matchService: { getReportMatches: ReturnType<typeof vi.fn> };
  let chatsService: { getOrCreateConversation: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let seenMatchesStore: { isNew: ReturnType<typeof vi.fn>; markSeen: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    matchService = { getReportMatches: vi.fn() };
    chatsService = { getOrCreateConversation: vi.fn() };
    toastService = { error: vi.fn(), success: vi.fn() };
    router = { navigate: vi.fn() };
    seenMatchesStore = { isNew: vi.fn().mockReturnValue(false), markSeen: vi.fn() };

    TestBed.configureTestingModule({
      imports: [MatchesPage],
      providers: [
        { provide: MatchService, useValue: matchService },
        { provide: ChatsService, useValue: chatsService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        { provide: SeenMatchesStore, useValue: seenMatchesStore },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'src' } } } },
      ],
    });

    fixture = TestBed.createComponent(MatchesPage);
    component = fixture.componentInstance;
  });

  it('carga el reporte y las coincidencias', async () => {
    const report = makeReportDetail();
    const matches = [makeMatch()];
    matchService.getReportMatches.mockResolvedValue({ report, matches });

    await component.ngOnInit();

    expect(matchService.getReportMatches).toHaveBeenCalledWith('src');
    expect(component.report()).toEqual(report);
    expect(component.matches()).toEqual(matches);
    expect(component.loading()).toBe(false);
    expect(component.reportTitle()).toBe('Toby');
  });

  it('marca las nuevas al cargar y las desmarca al verlas', async () => {
    const report = makeReportDetail();
    const matches = [makeMatch({ reportPublicId: 'r1' })];
    matchService.getReportMatches.mockResolvedValue({ report, matches });
    seenMatchesStore.isNew.mockReturnValue(true);

    await component.ngOnInit();
    expect(component.nuevos().has('r1')).toBe(true);

    component.marcarVista(makeMatch({ reportPublicId: 'r1' }));

    expect(seenMatchesStore.markSeen).toHaveBeenCalledWith('src', 'r1');
    expect(component.nuevos().has('r1')).toBe(false);
  });

  it('setea error cuando falla la carga', async () => {
    matchService.getReportMatches.mockRejectedValue(new Error('boom'));

    await component.ngOnInit();

    expect(component.error()).toBe('No se pudieron cargar las coincidencias');
    expect(component.loading()).toBe(false);
  });

  it('abre el chat obteniendo o creando la conversación', async () => {
    chatsService.getOrCreateConversation.mockResolvedValue('conv-9');

    await component.openChat(makeMatch({ userPublicId: 'owner-1' }));

    expect(chatsService.getOrCreateConversation).toHaveBeenCalledWith('owner-1');
    expect(router.navigate).toHaveBeenCalledWith(['/chats'], { queryParams: { conversation: 'conv-9' } });
  });

  it('no hace nada si la coincidencia no tiene dueño', async () => {
    await component.openChat(makeMatch({ userPublicId: '' }));

    expect(chatsService.getOrCreateConversation).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('muestra un toast si no se puede abrir el chat', async () => {
    chatsService.getOrCreateConversation.mockRejectedValue(new Error('x'));

    await component.openChat(makeMatch({ userPublicId: 'owner-1' }));

    expect(toastService.error).toHaveBeenCalledWith('No se pudo abrir el chat');
  });
});
