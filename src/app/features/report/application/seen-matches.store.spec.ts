import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SeenMatchesStore } from './seen-matches.store';
import { MatchViewsHttp } from '../infrastructure/match-views.http';

describe('SeenMatchesStore', () => {
  let store: SeenMatchesStore;
  let http: { getSeen: ReturnType<typeof vi.fn>; markSeen: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    http = {
      getSeen: vi.fn().mockResolvedValue([]),
      markSeen: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [SeenMatchesStore, { provide: MatchViewsHttp, useValue: http }],
    });
    store = TestBed.inject(SeenMatchesStore);
  });

  it('una coincidencia es nueva hasta que se marca vista', async () => {
    await store.ensureLoaded();
    expect(store.isNew('m1')).toBe(true);

    await store.markSeen('m1');

    expect(store.isNew('m1')).toBe(false);
    expect(http.markSeen).toHaveBeenCalledWith('m1');
  });

  it('carga las vistas existentes del server', async () => {
    http.getSeen.mockResolvedValue(['m1', 'm2']);

    await store.ensureLoaded();

    expect(store.isNew('m1')).toBe(false);
    expect(store.isNew('m2')).toBe(false);
    expect(store.isNew('m3')).toBe(true);
  });

  it('no vuelve a postear si ya estaba vista', async () => {
    http.getSeen.mockResolvedValue(['m1']);
    await store.ensureLoaded();

    await store.markSeen('m1');

    expect(http.markSeen).not.toHaveBeenCalled();
  });

  it('revierte la marca optimista si el server falla', async () => {
    http.markSeen.mockRejectedValue(new Error('boom'));
    await store.ensureLoaded();

    await store.markSeen('m1');

    expect(store.isNew('m1')).toBe(true);
  });
});
