import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReportEditLocationPage } from './report-edit-location';
import { ReportService } from '../../application/report.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { ReportDetail } from '../../infrastructure/report.http';

function makeReportDetail(type: 'SIGHTING' | 'LOST' = 'SIGHTING'): ReportDetail {
  return {
    publicId: 'report-uuid-1',
    type,
    status: 'ACTIVE',
    description: 'Descripción del reporte',
    createdAt: '2024-01-01T00:00:00.000Z',
    occurredAt: '2024-05-01T10:30:00.000Z',
    location: { address: 'Av. Corrientes 1234', latitude: -34.6, longitude: -58.38 },
    details: {
      publicId: 'pet-uuid-1',
      name: 'Firulais',
      petName: 'Rex',
      animalType: 'DOG',
      genderType: 'MALE',
      sizeType: 'MEDIUM',
      breed: 'Labrador',
      color: 'Negro',
      hasIdCollar: true,
      isInTransit: false,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/reports/img1.jpg' }],
    },
    user: { publicId: 'user-uuid', username: 'testuser', photoUrl: null },
  };
}

describe('ReportEditLocationPage', () => {
  let component: ReportEditLocationPage;
  let reportService: { getReportByPublicId: ReturnType<typeof vi.fn>; updateReport: ReturnType<typeof vi.fn> };
  let toastService: { success: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    reportService = {
      getReportByPublicId: vi.fn().mockResolvedValue(makeReportDetail()),
      updateReport: vi.fn().mockResolvedValue(undefined),
    };
    toastService = { success: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ReportEditLocationPage],
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'report-uuid-1' } } } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(ReportEditLocationPage).componentInstance;
  });

  describe('ngOnInit', () => {
    it('precarga dirección, coordenadas, fecha y hora', async () => {
      await component.ngOnInit();

      expect(reportService.getReportByPublicId).toHaveBeenCalledWith('report-uuid-1');
      expect(component.address()).toBe('Av. Corrientes 1234');
      expect(component.latitude()).toBe(-34.6);
      expect(component.longitude()).toBe(-58.38);
      expect(component.date()).toBe('2024-05-01');
    });

    it('setea serverError si la carga falla', async () => {
      reportService.getReportByPublicId.mockRejectedValue(new Error('No encontrado'));
      await component.ngOnInit();
      expect(component.serverError()).toBe('No encontrado');
    });
  });

  describe('guardar', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('llama updateReport con la ubicación y conserva las imágenes', async () => {
      await component.guardar();
      expect(reportService.updateReport).toHaveBeenCalledOnce();
      const cmd = reportService.updateReport.mock.calls[0][0];
      expect(cmd.publicId).toBe('report-uuid-1');
      expect(cmd.location.address).toBe('Av. Corrientes 1234');
      expect(cmd.keepImageIds).toEqual(['reports/img1']);
      expect(cmd.occurredAt).toBeInstanceOf(Date);
    });

    it('preserva los detalles actuales de la mascota', async () => {
      await component.guardar();
      const cmd = reportService.updateReport.mock.calls[0][0];
      expect(cmd.sightingDetails).toBeDefined();
      expect(cmd.sightingDetails.animalType).toBe('DOG');
      expect(cmd.sightingDetails.breed).toBe('Labrador');
    });

    it('envía lostDetails para reportes LOST', async () => {
      reportService.getReportByPublicId.mockResolvedValue(makeReportDetail('LOST'));
      await component.ngOnInit();
      await component.guardar();
      const cmd = reportService.updateReport.mock.calls[0][0];
      expect(cmd.lostDetails).toBeDefined();
      expect(cmd.lostDetails.petPublicId).toBe('pet-uuid-1');
      expect(cmd.sightingDetails).toBeUndefined();
    });

    it('navega al detalle y muestra toast tras guardar', async () => {
      await component.guardar();
      expect(router.navigate).toHaveBeenCalledWith(['/reports', 'report-uuid-1']);
      expect(toastService.success).toHaveBeenCalledOnce();
    });

    it('no guarda si no hay dirección', async () => {
      component.address.set('');
      await component.guardar();
      expect(reportService.updateReport).not.toHaveBeenCalled();
    });

    it('setea serverError si updateReport falla', async () => {
      reportService.updateReport.mockRejectedValue(new Error('Error del servidor'));
      await component.guardar();
      expect(component.serverError()).toBe('Error del servidor');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
