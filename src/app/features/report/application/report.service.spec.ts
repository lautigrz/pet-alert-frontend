import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportService } from './report.service';
import { ReportHttp, ReportDetail } from '../infrastructure/report.http';
import { UpdateReportCommand } from '../domain/report.commands';


function makeReportDetail(overrides: Partial<ReportDetail> = {}): ReportDetail {
  return {
    publicId:    overrides.publicId    ?? 'report-uuid-1',
    type:        overrides.type        ?? 'SIGHTING',
    status:      overrides.status      ?? 'ACTIVE',
    description: overrides.description ?? 'desc',
    createdAt:   overrides.createdAt   ?? '2024-01-01T00:00:00.000Z',
    occurredAt:  overrides.occurredAt  ?? '2024-01-01T10:00:00.000Z',
    location:    overrides.location    ?? { address: 'Calle 1', latitude: -34.6, longitude: -58.3 },
    details:     overrides.details     ?? {
      animalType: 'DOG', color: 'negro', hasIdCollar: false, isInTransit: false, images: [],
    },
    user: overrides.user ?? { publicId: 'user-uuid', username: 'test', photoUrl: null },
  };
}

function makeUpdateCommand(overrides: Partial<UpdateReportCommand> = {}): UpdateReportCommand {
  return {
    publicId:    overrides.publicId    ?? 'report-uuid-1',
    description: overrides.description ?? 'Descripción actualizada',
    occurredAt:  overrides.occurredAt  ?? new Date('2024-05-01T10:00:00.000Z'),
    location:    overrides.location    ?? { address: 'Av. Corrientes 1234', latitude: -34.6, longitude: -58.38 },
    keepImageIds: overrides.keepImageIds,
    newPhotos:    overrides.newPhotos,
    sightingDetails: overrides.sightingDetails,
    lostDetails:     overrides.lostDetails,
  };
}


describe('ReportService', () => {
  let reportHttp: {
    updateReport:        ReturnType<typeof vi.fn>;
    getReportByPublicId: ReturnType<typeof vi.fn>;
  };
  let service: ReportService;

  beforeEach(() => {
    reportHttp = {
      updateReport:        vi.fn().mockResolvedValue(undefined),
      getReportByPublicId: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReportService,
        { provide: ReportHttp, useValue: reportHttp },
      ],
    });

    service = TestBed.inject(ReportService);
  });


  describe('updateReport', () => {
    it('llama al http con publicId y campos base', async () => {
      await service.updateReport(makeUpdateCommand());

      expect(reportHttp.updateReport).toHaveBeenCalledOnce();
      const [publicId, body] = reportHttp.updateReport.mock.calls[0];
      expect(publicId).toBe('report-uuid-1');
      expect(body).toMatchObject({ description: 'Descripción actualizada' });
    });

    it('pasa keepImageIds y newPhotos al http', async () => {
      const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
      const cmd  = makeUpdateCommand({ keepImageIds: ['reports/img1'], newPhotos: [file] });

      await service.updateReport(cmd);

      const [, body] = reportHttp.updateReport.mock.calls[0];
      expect(body.keepImageIds).toEqual(['reports/img1']);
      expect(body.newPhotos).toEqual([file]);
    });

    it('pasa sightingDetails al http', async () => {
      const cmd = makeUpdateCommand({
        sightingDetails: { petName: 'Rex', color: 'blanco', hasIdCollar: true, isInTransit: false },
      });

      await service.updateReport(cmd);

      const [, body] = reportHttp.updateReport.mock.calls[0];
      expect(body.sightingDetails).toMatchObject({ petName: 'Rex', color: 'blanco' });
    });

    it('pasa lostDetails al http', async () => {
      const cmd = makeUpdateCommand({
        lostDetails: { petPublicId: 'pet-uuid-1', name: 'Firulais' },
      });

      await service.updateReport(cmd);

      const [, body] = reportHttp.updateReport.mock.calls[0];
      expect(body.lostDetails).toMatchObject({ petPublicId: 'pet-uuid-1', name: 'Firulais' });
    });

    it('recorta espacios de description', async () => {
      await service.updateReport(makeUpdateCommand({ description: '  texto  ' }));

      const [, body] = reportHttp.updateReport.mock.calls[0];
      expect(body.description).toBe('texto');
    });

    it('mapea error 403 a mensaje de permiso', async () => {
      reportHttp.updateReport.mockRejectedValue(
        new HttpErrorResponse({ status: 403, error: { error: 'Forbidden' } }),
      );

      await expect(service.updateReport(makeUpdateCommand()))
        .rejects.toThrow('No tenés permiso para editar este reporte');
    });

    it('mapea error de red (status 0)', async () => {
      reportHttp.updateReport.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

      await expect(service.updateReport(makeUpdateCommand()))
        .rejects.toThrow();
    });

    it('mapea error 400 al mensaje del backend', async () => {
      reportHttp.updateReport.mockRejectedValue(
        new HttpErrorResponse({ status: 400, error: { error: 'Campo inválido' } }),
      );

      await expect(service.updateReport(makeUpdateCommand()))
        .rejects.toThrow('Campo inválido');
    });
  });


  describe('getReportByPublicId', () => {
    it('retorna el reporte cuando existe', async () => {
      const detail = makeReportDetail({ publicId: 'report-abc' });
      reportHttp.getReportByPublicId.mockResolvedValue(detail);

      const result = await service.getReportByPublicId('report-abc');

      expect(reportHttp.getReportByPublicId).toHaveBeenCalledWith('report-abc');
      expect(result).toEqual(detail);
    });

    it('propaga el error cuando el http falla', async () => {
      reportHttp.getReportByPublicId.mockRejectedValue(
        new HttpErrorResponse({ status: 404, error: { error: 'Not found' } }),
      );

      await expect(service.getReportByPublicId('inexistente'))
        .rejects.toThrow();
    });
  });
});
