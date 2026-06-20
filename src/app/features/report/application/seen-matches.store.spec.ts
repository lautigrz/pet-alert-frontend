import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { SeenMatchesStore } from './seen-matches.store';
import { TokenStorage } from '../../auth/infrastructure/token.storage';

describe('SeenMatchesStore', () => {
  let store: SeenMatchesStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        SeenMatchesStore,
        { provide: TokenStorage, useValue: { read: () => null } },
      ],
    });
    store = TestBed.inject(SeenMatchesStore);
  });

  it('una coincidencia es nueva hasta que se marca vista', () => {
    expect(store.isNew('r1', 'a')).toBe(true);

    store.markSeen('r1', 'a');

    expect(store.isNew('r1', 'a')).toBe(false);
  });

  it('separa las vistas por reporte', () => {
    store.markSeen('r1', 'a');

    expect(store.isNew('r1', 'a')).toBe(false);
    expect(store.isNew('r2', 'a')).toBe(true);
  });

  it('no afecta a otras coincidencias del mismo reporte', () => {
    store.markSeen('r1', 'a');

    expect(store.isNew('r1', 'b')).toBe(true);
  });
});
