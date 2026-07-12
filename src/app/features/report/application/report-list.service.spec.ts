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
    location:
      over.location ?? {
        address: 'Calle 1',
        latitude: -34.6,
        longitude: -58.3,
      },
    details:
      over.details ??
      ({
        petName: 'Rex',
        animalType: 'DOG',
        hasIdCollar: false,
        isInTransit: false,
        color: 'negro',
        images: [],
      } as Reporte['details']),
    occurredAt: over.occurredAt ?? '2026-06-01T10:00:00.000Z',
    createdAt: over.createdAt ?? '2026-06-01T10:00:00.000Z',
  };
}

function paginated(data: Reporte[]): ReportesPaginados {
  return {
    data,
    pagination: {
      page: 1,
      limit: 50,
      total: data.length,
      totalPages: 1,
    },
  };
}

describe('ReportListService', () => {
  let reportesHttp: {
    getFiltered: ReturnType<typeof vi.fn>;
    getPaginatedMyReports: ReturnType<typeof vi.fn>;
    getUserReports: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  let service: ReportListService;

  beforeEach(() => {
    reportesHttp = {
      getFiltered: vi.fn(),
      getPaginatedMyReports: vi.fn(),
      getUserReports: vi.fn(),
      updateStatus: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReportListService,
        {
          provide: ReportListHttp,
          useValue: reportesHttp,
        },
      ],
    });

    service = TestBed.inject(ReportListService);
  });

  describe('getGenerals', () => {
    it('devuelve los reportes filtrados', async () => {
      const reportes = [
        makeReporte({ publicId: 'a' }),
        makeReporte({ publicId: 'b' }),
      ];

      reportesHttp.getFiltered.mockResolvedValue(reportes);

      const result = await service.getGenerals();

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({});
      expect(result).toEqual(reportes);
    });

    it('pasa los filtros al http', async () => {
      reportesHttp.getFiltered.mockResolvedValue([]);

      await service.getGenerals({
        reportType: 'LOST',
        animalType: 'CAT',
      });

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({
        reportType: 'LOST',
        animalType: 'CAT',
      });
    });

    it('reenvía lat y lng al http', async () => {
      reportesHttp.getFiltered.mockResolvedValue([]);

      await service.getGenerals({
        lat: -34.6,
        lng: -58.38,
      });

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({
        lat: -34.6,
        lng: -58.38,
      });
    });

    it('reenvía sort al http', async () => {
      reportesHttp.getFiltered.mockResolvedValue([]);

      await service.getGenerals({
        sort: 'recent',
      });

      expect(reportesHttp.getFiltered).toHaveBeenCalledWith({
        sort: 'recent',
      });
    });
  });

  describe('getMyReports', () => {
    it('pide al endpoint paginado y devuelve data', async () => {
      const reportes = [makeReporte({ publicId: 'mio-1' })];

      reportesHttp.getPaginatedMyReports.mockResolvedValue(
        paginated(reportes),
      );

      const result = await service.getMyReports();

      expect(reportesHttp.getPaginatedMyReports).toHaveBeenCalledWith({});
      expect(reportesHttp.getFiltered).not.toHaveBeenCalled();
      expect(result).toEqual(reportes);
    });

    it('pasa los filtros al endpoint paginado', async () => {
      reportesHttp.getPaginatedMyReports.mockResolvedValue(paginated([]));

      await service.getMyReports({
        reportType: 'LOST',
        animalType: 'CAT',
        radiusKm: 5,
      });

      expect(reportesHttp.getPaginatedMyReports).toHaveBeenCalledWith({
        reportType: 'LOST',
        animalType: 'CAT',
        radiusKm: 5,
      });
    });
  });

  describe('getPaginatedMyReports', () => {
    it('devuelve la respuesta paginada', async () => {
      const reportes = [makeReporte({ publicId: 'mio-1' })];
      const response = paginated(reportes);

      reportesHttp.getPaginatedMyReports.mockResolvedValue(response);

      const result = await service.getPaginatedMyReports(
        { reportType: 'SIGHTING' },
        2,
        10,
      );

      expect(reportesHttp.getPaginatedMyReports).toHaveBeenCalledWith(
        { reportType: 'SIGHTING' },
        2,
        10,
      );

      expect(result).toEqual(response);
    });
  });

  describe('getUserReports', () => {
    it('pide los reportes del usuario por publicId y los devuelve', async () => {
      const reportes = [makeReporte({ publicId: 'de-otro-1' })];

      reportesHttp.getUserReports.mockResolvedValue(reportes);

      const result = await service.getUserReports('user-99');

      expect(reportesHttp.getUserReports).toHaveBeenCalledWith('user-99');
      expect(result).toEqual(reportes);
    });

    it('mapea el error si el http falla', async () => {
      reportesHttp.getUserReports.mockRejectedValue(
        new HttpErrorResponse({ status: 0 }),
      );

      await expect(service.getUserReports('user-99')).rejects.toThrow(
        'No se pudo conectar con el servidor',
      );
    });
  });

  describe('updateToResolved', () => {
    it('actualiza el reporte a RESOLVED', async () => {
      reportesHttp.updateStatus.mockResolvedValue(undefined);

      await service.updateToResolved('rep-1', true);

      expect(reportesHttp.updateStatus).toHaveBeenCalledWith(
        'rep-1',
        'RESOLVED',
        true,
        undefined,
      );
    });

    it('reenvía la fecha de cierre si se provee', async () => {
      reportesHttp.updateStatus.mockResolvedValue(undefined);

      await service.updateToResolved('rep-1', true, '2026-07-10');

      expect(reportesHttp.updateStatus).toHaveBeenCalledWith(
        'rep-1',
        'RESOLVED',
        true,
        '2026-07-10',
      );
    });

    it('mapea errores al actualizar', async () => {
      reportesHttp.updateStatus.mockRejectedValue(
        new HttpErrorResponse({
          status: 400,
          error: { error: 'Estado inválido' },
        }),
      );

      await expect(service.updateToResolved('rep-1', true)).rejects.toThrow(
        'Estado inválido',
      );
    });
  });

  describe('manejo de errores', () => {
    it('mapea status 0 a error de conexión', async () => {
      reportesHttp.getFiltered.mockRejectedValue(
        new HttpErrorResponse({ status: 0 }),
      );

      await expect(service.getGenerals()).rejects.toThrow(
        'No se pudo conectar con el servidor',
      );
    });

    it('mapea status 400 al mensaje del backend', async () => {
      reportesHttp.getFiltered.mockRejectedValue(
        new HttpErrorResponse({
          status: 400,
          error: { error: 'Filtro inválido' },
        }),
      );

      await expect(service.getGenerals()).rejects.toThrow('Filtro inválido');
    });

    it('mapea un error inesperado', async () => {
      reportesHttp.getPaginatedMyReports.mockRejectedValue(new Error('boom'));

      await expect(service.getMyReports()).rejects.toThrow(
        'Ocurrió un error inesperado',
      );
    });

    it('mapea errores http genéricos', async () => {
      reportesHttp.getFiltered.mockRejectedValue(
        new HttpErrorResponse({ status: 500 }),
      );

      await expect(service.getGenerals()).rejects.toThrow(
        'No se pudieron cargar los reportes',
      );
    });
  });
});
