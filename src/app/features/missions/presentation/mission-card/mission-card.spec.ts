import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MissionCardComponent } from './mission-card';
import { MissionCardOutput } from '../../infrastructure/models/mission.model';

const baseMission: MissionCardOutput = {
  publicId: 'mission-1',
  status: 'OPEN',
  createdAt: new Date('2026-07-01T10:00:00.000Z'),
  searchArea: {
    latitude: -34.6,
    longitude: -58.38,
    radius: 5000,
  },
  report: {
    publicId: 'report-1',
    location: {
      address: 'Av. Rivadavia 1234, Caballito, Buenos Aires, Argentina',
      latitude: -34.6,
      longitude: -58.38,
    },
    photoUrl: 'https://example.com/pet.jpg',
    title: 'Rocky',
    status: 'ACTIVE',
    petDetails: {
      name: 'Rocky',
      photoUrl: null,
      gender: 'MALE',
      size: 'MEDIUM',
    },
  },
};

describe('MissionCardComponent', () => {
  let fixture: ComponentFixture<MissionCardComponent>;
  let component: MissionCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MissionCardComponent] });
    fixture = TestBed.createComponent(MissionCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('uses the report title when it exists', () => {
    component.mission = baseMission;
    expect(component.title()).toBe('Rocky');
  });

  it('falls back to the pet name and then to a default title', () => {
    component.mission = {
      ...baseMission,
      report: { ...baseMission.report, title: null, petDetails: { name: 'Luna', photoUrl: null, gender: 'FEMALE', size: 'SMALL' } },
    };
    expect(component.title()).toBe('Luna');

    component.mission = {
      ...baseMission,
      report: { ...baseMission.report, title: null, petDetails: undefined },
    };
    expect(component.title()).toBe('Búsqueda de mascota');
  });

  it('prefers the report photo and falls back to the pet photo', () => {
    component.mission = baseMission;
    expect(component.image()).toBe('https://example.com/pet.jpg');

    component.mission = {
      ...baseMission,
      report: {
        ...baseMission.report,
        photoUrl: null,
        petDetails: { name: 'Luna', photoUrl: 'https://example.com/luna.jpg', gender: 'FEMALE', size: 'SMALL' },
      },
    };
    expect(component.image()).toBe('https://example.com/luna.jpg');
  });

  it('shortens the address to its first three parts', () => {
    component.mission = baseMission;
    expect(component.address()).toBe('Av. Rivadavia 1234, Caballito, Buenos Aires');
  });

  it('converts the radius from meters to kilometers', () => {
    component.mission = baseMission;
    expect(component.radiusKm()).toBe('5');

    component.mission = { ...baseMission, searchArea: { ...baseMission.searchArea, radius: 2500 } };
    expect(component.radiusKm()).toBe('2.5');
  });

  it('maps the status to a label and a color', () => {
    component.mission = baseMission;
    expect(component.statusLabel()).toBe('Abierta');
    expect(component.statusColor()).toBe('#E8842E');

    component.mission = { ...baseMission, status: 'IN_PROGRESS' };
    expect(component.statusLabel()).toBe('En progreso');
    expect(component.statusColor()).toBe('#E8842E');

    component.mission = { ...baseMission, status: 'CLOSED' };
    expect(component.statusLabel()).toBe('Cerrada');
    expect(component.statusColor()).toBe('#94A3B8');
  });
});
