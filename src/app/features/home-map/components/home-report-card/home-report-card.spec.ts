import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, it, expect } from 'vitest';
import { HomeReportCardComponent } from './home-report-card';
import type { Reporte } from '../../../report/domain/report-read.model';

const mockReporte = (overrides: Partial<Reporte> = {}): Reporte =>
  ({
    publicId: 'rep-1',
    type: 'LOST',
    status: 'ACTIVE',
    createdAt: '2026-06-01T10:00:00.000Z',
    occurredAt: '2026-06-01T10:00:00.000Z',
    location: {
      address: 'Avenida Corrientes 123',
      latitude: -34.6037,
      longitude: -58.3816,
    },
    details: {
      animalType: 'DOG',
      images: [],
    },
    ...overrides,
  }) as unknown as Reporte;

describe('HomeReportCardComponent', () => {
  let component: HomeReportCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeReportCardComponent],
      providers: [provideRouter([])],
    });

    component = TestBed.createComponent(HomeReportCardComponent).componentInstance;
  });

  it('marks the report as featured when the featured flag is true', () => {
    component.reporte = mockReporte({ featured: true });

    expect(component.destacado()).toBe(true);
  });

  it('does not mark the report as featured when the featured flag is missing', () => {
    component.reporte = mockReporte();

    expect(component.destacado()).toBe(false);
  });

  it('does not mark the report as featured when the featured flag is false', () => {
    component.reporte = mockReporte({ featured: false });

    expect(component.destacado()).toBe(false);
  });
});
