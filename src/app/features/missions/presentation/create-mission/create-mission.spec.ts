import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { CreateMissionPage } from './create-mission';
import { ReportService } from '../../../report/application/report.service';
import { MissionService } from '../../application/mission.service';
import { ToastService } from '../../../../shared/application/toast.service';

vi.mock('leaflet', () => {
  const createMarkerMock = () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    closePopup: vi.fn(),
    setLatLng: vi.fn(),
    setRadius: vi.fn(),
    remove: vi.fn(),
    getLatLng: vi.fn().mockReturnValue({ lat: -34.6037, lng: -58.3816 })
  });

  const mapMock = {
    setView: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    on: vi.fn().mockReturnThis(),
    removeLayer: vi.fn()
  };

  return {
    map: vi.fn().mockReturnValue(mapMock),
    tileLayer: vi.fn().mockReturnValue({
      addTo: vi.fn().mockReturnThis()
    }),
    marker: vi.fn().mockReturnValue(createMarkerMock()),
    circle: vi.fn().mockReturnValue(createMarkerMock()),
    divIcon: vi.fn().mockReturnValue({})
  };
});

describe('CreateMissionPage', () => {
  let component: CreateMissionPage;
  let fixture: ComponentFixture<CreateMissionPage>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockReportService: any;
  let mockMissionService: any;
  let mockToastService: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('report-abc')
        }
      }
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    mockReportService = {
      getReportByPublicId: vi.fn().mockResolvedValue({
        publicId: 'report-abc',
        location: { latitude: -34.6037, longitude: -58.3816 }
      })
    };

    mockMissionService = {
      createMission: vi.fn().mockReturnValue(of({ missionId: 1, publicId: 'mission-abc' }))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CreateMissionPage],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ReportService, useValue: mockReportService },
        { provide: MissionService, useValue: mockMissionService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateMissionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('onInit', () => {
    it('debería cargar los detalles del reporte por publicId', async () => {
      await component.ngOnInit();
      expect(mockReportService.getReportByPublicId).toHaveBeenCalledWith('report-abc');
      expect(component.report).toBeDefined();
    });
  });

  describe('volver', () => {
    it('debería navegar de vuelta al detalle del reporte', () => {
      component.volver();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/reports', 'report-abc']);
    });
  });

  describe('validación al continuar', () => {
    it('debería mostrar un toast de error si el título está vacío', () => {
      component.titulo = '';
      component.descripcion = 'Alguna instrucción';

      component.continuar();

      expect(mockToastService.error).toHaveBeenCalledWith('Ingresá un título para la misión');
      expect(component.step).toBe(1);
    });

    it('debería mostrar un toast de error si la descripción está vacía', () => {
      component.titulo = 'Misión de búsqueda';
      component.descripcion = '';

      component.continuar();

      expect(mockToastService.error).toHaveBeenCalledWith('Ingresá una descripción');
      expect(component.step).toBe(1);
    });

    it('debería pasar al paso 2 e inicializar el mapa si es válido', () => {
      vi.useFakeTimers();
      component.titulo = 'Misión de búsqueda';
      component.descripcion = 'Alguna instrucción';

      component.continuar();
      vi.advanceTimersByTime(150);

      expect(component.step).toBe(2);
      vi.useRealTimers();
    });
  });

  describe('guardarMision', () => {
    it('debería llamar a MissionService.createMission y navegar al inicio al guardar con éxito', async () => {
      component.titulo = 'Misión de búsqueda';
      component.descripcion = 'Alguna instrucción';
      component.radio = 800;

      (component as any).missionMarker = {
        getLatLng: vi.fn().mockReturnValue({ lat: -34.6037, lng: -58.3816 })
      };

      await component.guardarMision();

      expect(mockMissionService.createMission).toHaveBeenCalledWith({
        reportPublicId: 'report-abc',
        latitude: -34.6037,
        longitude: -58.3816,
        radius: 800,
        title: 'Misión de búsqueda',
        description: 'Alguna instrucción'
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home'], {
        state: { missionCreated: true }
      });
    });

    it('debería mostrar un toast de error si falla la creación de la misión', async () => {
      mockMissionService.createMission.mockReturnValue(throwError(() => new Error('API error')));
      (component as any).missionMarker = {
        getLatLng: vi.fn().mockReturnValue({ lat: -34.6037, lng: -58.3816 })
      };

      await component.guardarMision();

      expect(mockToastService.error).toHaveBeenCalledWith('No se pudo crear la misión');
    });
  });
});
