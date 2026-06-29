import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';

import { ReportCardComponent } from './report-card';
import { Reporte } from '../../../domain/report-read.model';

function reporteCon(address: string): Reporte {
  return {
    publicId: 'r1',
    user: { publicId: 'u1' },
    type: 'LOST',
    status: 'ACTIVE',
    description: '',
    location: { address, latitude: 0, longitude: 0 },
    details: { name: 'Firulais', images: [] },
    occurredAt: '2026-06-20T10:00:00.000Z',
    createdAt: '2026-06-20T10:00:00.000Z',
  } as unknown as Reporte;
}

describe('ReportCardComponent', () => {
  let component: ReportCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    component = TestBed.createComponent(ReportCardComponent).componentInstance;
  });

  describe('direccion', () => {
    it('devuelve "Sin ubicación" cuando la dirección está vacía', () => {
      component.reporte = reporteCon('');

      expect(component.direccion()).toBe('Sin ubicación');
    });

    it('reordena el número y descarta zonas repetidas mostrando calle, localidad y partido', () => {
      component.reporte = reporteCon(
        '362, Doctor Gabriel Ardoino, Ramos Mejía Norte, Ramos Mejía, Partido de La Matanza, Buenos Aires, B1704EKI, Argentina',
      );

      expect(component.direccion()).toBe(
        'Doctor Gabriel Ardoino 362, Ramos Mejía, Partido de La Matanza',
      );
    });

    it('muestra los primeros tres segmentos cuando no empieza con número', () => {
      component.reporte = reporteCon('Avenida Corrientes 123, Balvanera, CABA, Argentina');

      expect(component.direccion()).toBe('Avenida Corrientes 123, Balvanera, CABA');
    });

    it('devuelve la dirección tal cual cuando no tiene comas', () => {
      component.reporte = reporteCon('Avenida Corrientes 123');

      expect(component.direccion()).toBe('Avenida Corrientes 123');
    });
  });
});
