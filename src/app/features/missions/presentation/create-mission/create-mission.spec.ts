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
  let mockActivatedRoute: {
    snapshot: {
      paramMap: {
        get: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
    url: string;
    events: unknown;
  };
  let mockReportService: {
    getReportByPublicId: ReturnType<typeof vi.fn>;
  };
  let mockMissionService: {
    createMission: ReturnType<typeof vi.fn>;
    updateMission: ReturnType<typeof vi.fn>;
    getMissionDetail: ReturnType<typeof vi.fn>;
  };
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('report-abc')
        }
      }
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
      url: '/missions/create/report-abc',
      events: of()
    };

    mockReportService = {
      getReportByPublicId: vi.fn().mockResolvedValue({
        publicId: 'report-abc',
        location: { latitude: -34.6037, longitude: -58.3816 },
        details: { name: 'Bobby', images: [] }
      })
    };

    mockMissionService = {
      createMission: vi.fn().mockReturnValue(of({ missionId: 1, publicId: 'mission-abc' })),
      updateMission: vi.fn().mockReturnValue(of(void 0)),
      getMissionDetail: vi.fn().mockReturnValue(of({
        publicId: 'mission-abc',
        title: 'Misión de prueba',
        description: 'Detalle de prueba',
        searchArea: { radius: 1200, latitude: -34.6037, longitude: -58.3816 },
        report: { publicId: 'report-abc' }
      }))
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
  });

  it('debería crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('onInit en modo creación', () => {
    it('debería cargar los detalles del reporte por publicId', async () => {
      fixture.detectChanges();
      await component.ngOnInit();
      expect(mockReportService.getReportByPublicId).toHaveBeenCalledWith('report-abc');
      expect(component.report).toBeDefined();
      expect(component.isEditMode).toBe(false);
    });
  });

  describe('onInit en modo edición', () => {
    it('debería cargar los detalles de la misión y el reporte asociado', async () => {
      mockRouter.url = '/missions/edit/mission-abc';
      mockActivatedRoute.snapshot.paramMap.get = vi.fn().mockReturnValue('mission-abc');

      fixture.detectChanges();
      await component.ngOnInit();

      expect(component.isEditMode).toBe(true);
      expect(component.missionId).toBe('mission-abc');
      expect(mockMissionService.getMissionDetail).toHaveBeenCalledWith('mission-abc');
      expect(component.title).toBe('Misión de prueba');
      expect(component.description).toBe('Detalle de prueba');
      expect(component.radius).toBe(1200);
      expect(mockReportService.getReportByPublicId).toHaveBeenCalledWith('report-abc');
    });
  });

  describe('goBack', () => {
    it('debería navegar de vuelta al detalle del reporte si es modo creación', () => {
      component.isEditMode = false;
      component.reportId = 'report-abc';
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/reports', 'report-abc']);
    });

    it('debería navegar de vuelta al detalle de la misión si es modo edición', () => {
      component.isEditMode = true;
      component.missionId = 'mission-abc';
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/missions', 'mission-abc']);
    });
  });

  describe('saveMission en modo creación', () => {
    beforeEach(() => {
      component.isEditMode = false;
      component.reportId = 'report-abc';
    });

    it('debería mostrar un toast de error si el título está vacío', async () => {
      component.title = '';
      component.description = 'Alguna descripción';

      await component.saveMission();

      expect(mockToastService.error).toHaveBeenCalledWith('Ingresá un título para la misión');
    });

    it('debería mostrar un toast de error si la descripción está vacía', async () => {
      component.title = 'Buscar a Bobby';
      component.description = '';

      await component.saveMission();

      expect(mockToastService.error).toHaveBeenCalledWith('Ingresá una descripción');
    });

    it('debería llamar a MissionService.createMission y navegar al inicio al guardar con éxito', async () => {
      component.title = 'Misión de búsqueda';
      component.description = 'Alguna instrucción';
      component.radius = 800;

      (component as unknown as { missionMarker: unknown }).missionMarker = {
        getLatLng: vi.fn().mockReturnValue({ lat: -34.6037, lng: -58.3816 })
      };

      await component.saveMission();

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
      expect(mockToastService.success).toHaveBeenCalledWith('Misión iniciada con éxito');
    });

    it('debería mostrar un toast de error si falla la creación de la misión', async () => {
      mockMissionService.createMission.mockReturnValue(throwError(() => new Error('API error')));
      component.title = 'Misión de búsqueda';
      component.description = 'Alguna instrucción';
      (component as unknown as { missionMarker: unknown }).missionMarker = {
        getLatLng: vi.fn().mockReturnValue({ lat: -34.6037, lng: -58.3816 })
      };

      await component.saveMission();

      expect(mockToastService.error).toHaveBeenCalledWith('No se pudo crear la misión');
    });
  });

  describe('saveMission en modo edición', () => {
    beforeEach(() => {
      component.isEditMode = true;
      component.missionId = 'mission-abc';
    });

    it('debería llamar a MissionService.updateMission y navegar al detalle de la misión al guardar con éxito', async () => {
      component.title = 'Misión de búsqueda editada';
      component.description = 'Instrucción editada';
      component.radius = 1500;

      (component as unknown as { missionMarker: unknown }).missionMarker = {
        getLatLng: vi.fn().mockReturnValue({ lat: -34.6037, lng: -58.3816 })
      };

      await component.saveMission();

      expect(mockMissionService.updateMission).toHaveBeenCalledWith('mission-abc', {
        title: 'Misión de búsqueda editada',
        description: 'Instrucción editada',
        latitude: -34.6037,
        longitude: -58.3816,
        radius: 1500
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/missions', 'mission-abc']);
      expect(mockToastService.success).toHaveBeenCalledWith('Misión actualizada con éxito');
    });

    it('debería mostrar un toast de error si falla la actualización de la misión', async () => {
      mockMissionService.updateMission.mockReturnValue(throwError(() => new Error('API error')));
      component.title = 'Misión de búsqueda editada';
      component.description = 'Instrucción editada';
      (component as unknown as { missionMarker: unknown }).missionMarker = {
        getLatLng: vi.fn().mockReturnValue({ lat: -34.6037, lng: -58.3816 })
      };

      await component.saveMission();

      expect(mockToastService.error).toHaveBeenCalledWith('No se pudo actualizar la misión');
    });
  });
});
