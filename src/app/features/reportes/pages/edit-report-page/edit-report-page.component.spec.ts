import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EditReportPageComponent } from './edit-report-page.component';
import { ReportService } from '../../../report/application/report.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { ReportDetail } from '../../../report/infrastructure/report.http';
import { InteractiveMapComponent } from '../../../../shared/component/interactive-map/interactive-map.component';


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
      genderType: 'MALE',
      sizeType: 'MEDIUM',
      breed: 'Labrador',
      color: 'negro',
      hasIdCollar: true,
      isInTransit: false,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/reports/img1.jpg' }],
    },
    user: { publicId: 'user-uuid', username: 'testuser', photoUrl: null },
  };
}


describe('EditReportPageComponent', () => {
  let component: EditReportPageComponent;
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
      imports: [EditReportPageComponent],
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'report-uuid-1' } } } },
      ],
    })
      .overrideComponent(EditReportPageComponent, {
        remove: { imports: [InteractiveMapComponent] },
        add: { imports: [] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(EditReportPageComponent);
    component = fixture.componentInstance;
  });


  describe('ngOnInit', () => {
    it('carga el reporte y patchea el form', async () => {
      await component.ngOnInit();

      expect(reportService.getReportByPublicId).toHaveBeenCalledWith('report-uuid-1');
      expect(component.report()?.publicId).toBe('report-uuid-1');
      expect(component.form.value.color).toBe('negro');
      expect(component.form.value.hasIdCollar).toBe(true);
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

    it('no agrega más fotos si ya llegó al máximo', () => {
      component.existingImages.set([
        { cloudinaryId: 'a', url: 'https://a.jpg' },
        { cloudinaryId: 'b', url: 'https://b.jpg' },
        { cloudinaryId: 'c', url: 'https://c.jpg' },
        { cloudinaryId: 'd', url: 'https://d.jpg' },
      ]);

      const file = new File(['x'], 'extra.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file],
          value: '',
        },
      } as unknown as Event;

      component.onFilesSelected(event);
      expect(component.newPhotos()).toHaveLength(0);
    });


    describe('submit', () => {
      beforeEach(async () => {
        await component.ngOnInit();
      });

      it('llama updateReport con publicId y keepImageIds', async () => {
        await component.submit();

        expect(reportService.updateReport).toHaveBeenCalledOnce();
        const cmd = reportService.updateReport.mock.calls[0][0];
        expect(cmd.publicId).toBe('report-uuid-1');
        expect(cmd.keepImageIds).toEqual(['reports/img1']);
      });

      it('navega al detalle tras guardar con éxito', async () => {
        await component.submit();
        expect(router.navigate).toHaveBeenCalledWith(['/detalle-reporte', 'report-uuid-1']);
      });

      it('muestra toast de éxito tras guardar', async () => {
        await component.submit();
        expect(toastService.success).toHaveBeenCalledOnce();
      });

      it('setea serverError si updateReport falla', async () => {
        reportService.updateReport.mockRejectedValue(new Error('Error del servidor'));
        await component.submit();

        expect(component.serverError()).toBe('Error del servidor');
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('envía sightingDetails para reportes SIGHTING', async () => {
        await component.submit();

        const cmd = reportService.updateReport.mock.calls[0][0];
        expect(cmd.sightingDetails).toBeDefined();
        expect(cmd.lostDetails).toBeUndefined();
      });

      it('envía lostDetails para reportes LOST', async () => {
        reportService.getReportByPublicId.mockResolvedValue(makeReportDetail('LOST'));
        await component.ngOnInit();
        await component.submit();

        const cmd = reportService.updateReport.mock.calls[0][0];
        expect(cmd.lostDetails).toBeDefined();
        expect(cmd.sightingDetails).toBeUndefined();
      });
    });


    describe('getters', () => {
      beforeEach(async () => {
        await component.ngOnInit();
      });

      it('initialLocation retorna la ubicación del reporte', () => {
        const loc = component.initialLocation;
        expect(loc?.address).toBe('Av. Corrientes 1234');
        expect(loc?.latitude).toBe(-34.6);
      });

      it('initialLocation retorna null si no hay reporte', () => {
        component.report.set(null);
        expect(component.initialLocation).toBeNull();
      });

      it('pinImageUrl retorna la URL de la primera imagen existente', () => {
        expect(component.pinImageUrl).toContain('res.cloudinary.com');
      });

      it('pinImageUrl retorna null si no hay imágenes', () => {
        component.existingImages.set([]);
        component.newPhotos.set([]);
        expect(component.pinImageUrl).toBeNull();
      });
    });
  });
});
