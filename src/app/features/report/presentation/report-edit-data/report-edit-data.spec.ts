import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReportEditDataPage } from './report-edit-data';
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
    occurredAt: '2024-05-01T10:00:00.000Z',
    location: { address: 'Av. Corrientes 1234', latitude: -34.6, longitude: -58.38 },
    details: {
      publicId: 'pet-uuid-1',
      name: 'Firulais',
      petName: 'Rex',
      animalType: 'DOG',
      genderType: 'FEMALE',
      sizeType: 'LARGE',
      breed: 'Labrador',
      color: 'Negro',
      hasIdCollar: true,
      isInTransit: false,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/reports/img1.jpg' }],
    },
    user: { publicId: 'user-uuid', username: 'testuser', photoUrl: null },
  };
}

describe('ReportEditDataPage', () => {
  let component: ReportEditDataPage;
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
      imports: [ReportEditDataPage],
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'report-uuid-1' } } } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(ReportEditDataPage).componentInstance;
  });

  describe('ngOnInit', () => {
    it('precarga los signals mapeando enums de DB a UI', async () => {
      await component.ngOnInit();

      expect(reportService.getReportByPublicId).toHaveBeenCalledWith('report-uuid-1');
      expect(component.petName()).toBe('Firulais');
      expect(component.petSpecies()).toBe('perro');
      expect(component.petGender()).toBe('hembra');
      expect(component.petSize()).toBe('grande');
      expect(component.petColor()).toBe('Negro');
      expect(component.hasIdentification()).toBe('si');
    });

    it('carga las imágenes existentes en existingImages', async () => {
      await component.ngOnInit();
      expect(component.existingImages()).toHaveLength(1);
      expect(component.existingImages()[0].cloudinaryId).toBe('reports/img1');
    });

    it('setea serverError si la carga falla', async () => {
      reportService.getReportByPublicId.mockRejectedValue(new Error('No encontrado'));
      await component.ngOnInit();
      expect(component.serverError()).toBe('No encontrado');
    });
  });

  describe('gestión de imágenes', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('removeExisting quita la imagen del signal', () => {
      const id = component.existingImages()[0].cloudinaryId;
      component.removeExisting(id);
      expect(component.existingImages()).toHaveLength(0);
    });

    it('removeNew quita la nueva foto por índice', () => {
      const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
      component.newPhotos.set([{ preview: 'data:img', file }]);
      component.removeNew(0);
      expect(component.newPhotos()).toHaveLength(0);
    });

    it('totalPhotos suma existentes + nuevas', () => {
      const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
      component.newPhotos.set([{ preview: 'data:img', file }]);
      expect(component.totalPhotos).toBe(2);
    });
  });

  describe('guardar', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('llama updateReport con publicId y keepImageIds', async () => {
      await component.guardar();
      expect(reportService.updateReport).toHaveBeenCalledOnce();
      const cmd = reportService.updateReport.mock.calls[0][0];
      expect(cmd.publicId).toBe('report-uuid-1');
      expect(cmd.keepImageIds).toEqual(['reports/img1']);
    });

    it('mapea los signals UI de vuelta a enums de DB', async () => {
      await component.guardar();
      const cmd = reportService.updateReport.mock.calls[0][0];
      expect(cmd.sightingDetails.animalType).toBe('DOG');
      expect(cmd.sightingDetails.genderType).toBe('FEMALE');
      expect(cmd.sightingDetails.sizeType).toBe('LARGE');
      expect(cmd.sightingDetails.hasIdCollar).toBe(true);
    });

    it('preserva la ubicación y fecha actuales', async () => {
      await component.guardar();
      const cmd = reportService.updateReport.mock.calls[0][0];
      expect(cmd.location.address).toBe('Av. Corrientes 1234');
      expect(cmd.occurredAt).toBeInstanceOf(Date);
    });

    it('navega al detalle tras guardar con éxito', async () => {
      await component.guardar();
      expect(router.navigate).toHaveBeenCalledWith(['/reports', 'report-uuid-1']);
    });

    it('muestra toast de éxito tras guardar', async () => {
      await component.guardar();
      expect(toastService.success).toHaveBeenCalledOnce();
    });

    it('setea serverError si updateReport falla', async () => {
      reportService.updateReport.mockRejectedValue(new Error('Error del servidor'));
      await component.guardar();
      expect(component.serverError()).toBe('Error del servidor');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('envía lostDetails para reportes LOST', async () => {
      reportService.getReportByPublicId.mockResolvedValue(makeReportDetail('LOST'));
      await component.ngOnInit();
      await component.guardar();
      const cmd = reportService.updateReport.mock.calls[0][0];
      expect(cmd.lostDetails).toBeDefined();
      expect(cmd.sightingDetails).toBeUndefined();
      expect(cmd.lostDetails.petPublicId).toBe('pet-uuid-1');
    });
  });
});
