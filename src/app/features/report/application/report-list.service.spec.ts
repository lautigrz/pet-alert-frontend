import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReportListService } from './report-list.service';
import { ReportListHttp } from '../infrastructure/report-list.http';
import { Reporte, ReportesPaginados } from '../domain/report-read.model';

function makeReporte(over: Partial<Reporte> = {}): Reporte {
  return {
    publicId: over.publicId ?? 'rep-1',
    user: over.user ?? { publicId: 'user-1' },
    type: over.type ?? 'SIGHTING',
    status: over.status ?? 'ACTIVE',
    description: over.description ?? 'desc',
    location: over.location ?? { address: 'Calle 1', latitude: -34.6, longitude: -58.3 },
    details:
      over.details ??
      ({ animalType: 'DOG', hasIdCollar: false, isInTransit: false, color: 'negro', images: [] } as Reporte['details']),
    occurredAt: over.occurredAt ?? '2026-06-01T10:00:00.000Z',
    createdAt: over.createdAt ?? '2026-06-01T10:00:00.000Z',
  };
}

function paginado(data: Reporte[]): ReportesPaginados {
  return { data, pagination: { page: 1, limit: 50, total: data.length, totalPages: 1 } };
}

describe('ReportListService', () => {
  let reportesHttp: {
    getFiltered: ReturnType<typeof vi.fn>;
    getMisReportesPaginado: ReturnType<typeof vi.fn>;
  };
  let service: ReportListService;

  beforeEach(() => {
    reportesHttp = {
      getFiltered: vi.fn(),
      getMisReportesPaginado: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ReportListService, { provide: ReportListHttp, useValue: reportesHttp }],
    });

    service = TestBed.inject(ReportListService);
  });

  describe('getGenerales', () => {
    it('devuelve los reportes que trae /reports/filter', async () => {
      const reportes = [makeReporte({ publicId: 'a' }), makeReporte({ publicId: 'b' })];
      reportesHttp.getFiltered.mockResolvedValue(reportes);

      const result = await service.getGenerales();

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({});
      expect(result).toEqual(reportes);
    });

    it('pasa los filtros al http', async () => {
      reportesHttp.getFiltered.mockResolvedValue([]);

      await service.getGenerales({ reportType: 'LOST', animalType: 'CAT' });

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({ reportType: 'LOST', animalType: 'CAT' });
    });

    it('reenvía lat y lng al http para ordenar por cercanía', async () => {
      reportesHttp.getFiltered.mockResolvedValue([]);

      await service.getGenerales({ lat: -34.6, lng: -58.38 });

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({ lat: -34.6, lng: -58.38 });
    });

    it('reenvía sort al http para ordenar por recientes', async () => {
      reportesHttp.getFiltered.mockResolvedValue([]);

      await service.getGenerales({ sort: 'recent' });

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({ sort: 'recent' });
    });
  });

  describe('getMisReportes', () => {
    it('pide al endpoint paginado y devuelve el data', async () => {
      const reportes = [makeReporte({ publicId: 'mio-1' })];
      reportesHttp.getMisReportesPaginado.mockResolvedValue(paginado(reportes));

      const result = await service.getMisReportes();

      expect(reportesHttp.getMisReportesPaginado).toHaveBeenCalledWith({});
      expect(reportesHttp.getFiltered).not.toHaveBeenCalled();
      expect(result).toEqual(reportes);
    });

    it('pasa los filtros al endpoint paginado', async () => {
      reportesHttp.getMisReportesPaginado.mockResolvedValue(paginado([]));

      await service.getMisReportes({ reportType: 'LOST', animalType: 'CAT', radiusKm: 5 });

      expect(reportesHttp.getMisReportesPaginado).toHaveBeenCalledWith({
        reportType: 'LOST',
        animalType: 'CAT',
        radiusKm: 5,
      });
    });
  });

  describe('manejo de errores', () => {
    it('mapea status 0 a error de conexión', async () => {
      reportesHttp.getFiltered.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

      await expect(service.getGenerales()).rejects.toThrow('No se pudo conectar con el servidor');
    });

    it('mapea status 400 al mensaje del backend', async () => {
      reportesHttp.getFiltered.mockRejectedValue(
        new HttpErrorResponse({ status: 400, error: { error: 'Filtro inválido' } }),
      );

      await expect(service.getGenerales()).rejects.toThrow('Filtro inválido');
    });

    it('mapea un error inesperado', async () => {
      reportesHttp.getMisReportesPaginado.mockRejectedValue(new Error('boom'));

      await expect(service.getMisReportes()).rejects.toThrow('Ocurrió un error inesperado');
    });
  });
});
