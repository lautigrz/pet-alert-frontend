import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MatchCardComponent } from './match-card';
import { Match } from '../../../domain/match.model';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    matchPublicId: 'm1',
    reportPublicId: 'r1',
    userPublicId: 'u1',
    name: 'Toby',
    image: 'img.jpg',
    username: 'ana',
    foundAt: '2024-01-01T10:00:00.000Z',
    distanceKm: 3.4,
    score: 0.82,
    ...overrides,
  };
}

describe('MatchCardComponent', () => {
  let fixture: ComponentFixture<MatchCardComponent>;
  let component: MatchCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatchCardComponent],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(MatchCardComponent);
    component = fixture.componentInstance;
  });

  it('calcula el porcentaje a partir del score', () => {
    fixture.componentRef.setInput('match', makeMatch({ score: 0.876 }));
    fixture.detectChanges();

    expect(component.percentage()).toBe('88%');
  });

  it('no marca como nueva por defecto', () => {
    fixture.componentRef.setInput('match', makeMatch());
    fixture.detectChanges();

    expect(component.nueva()).toBe(false);
  });

  it('emite el match al contactar', () => {
    const match = makeMatch();
    fixture.componentRef.setInput('match', match);
    fixture.detectChanges();

    const spy = vi.fn();
    component.contact.subscribe(spy);
    component.onContact();

    expect(spy).toHaveBeenCalledWith(match);
  });
});
