import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { HomeMapComponent } from './home-map';
import { ReportListService } from '../report/application/report-list.service';
import { ProfileService } from '../profile/application/profile.service';
import { NotificationService } from '../notifications/application/notification.service';
import type { Reporte } from '../report/domain/report-read.model';

vi.mock('leaflet', () => {
  const createMarkerMock = () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    closePopup: vi.fn(),
    setLatLng: vi.fn(),
    setLatLngs: vi.fn(),
    setRadius: vi.fn(),
    remove: vi.fn(),
  });

  const mapMock = {
    setView: vi.fn().mockReturnThis(),
    getCenter: vi.fn().mockReturnValue({
      lat: -34.6037,
      lng: -58.3816,
    }),
    invalidateSize: vi.fn(),
    on: vi.fn().mockReturnThis(),
    attributionControl: {
      setPrefix: vi.fn(),
      setPosition: vi.fn(),
    },
    zoomControl: {
      setPosition: vi.fn(),
    },
  };

  const domEvent = {
    on: vi.fn().mockReturnThis(),
    stop: vi.fn(),
  };

  return {
    map: vi.fn().mockReturnValue(mapMock),
    tileLayer: vi.fn().mockReturnValue({
      addTo: vi.fn().mockReturnThis(),
    }),
    layerGroup: vi.fn().mockReturnValue({
      addTo: vi.fn().mockReturnThis(),
      clearLayers: vi.fn(),
    }),
    marker: vi.fn().mockReturnValue(createMarkerMock()),
    circle: vi.fn().mockReturnValue(createMarkerMock()),
    circleMarker: vi.fn().mockReturnValue(createMarkerMock()),
    polygon: vi.fn().mockReturnValue(createMarkerMock()),
    divIcon: vi.fn().mockImplementation((options) => ({
      options,
    })),
    latLng: vi.fn().mockImplementation((lat: number, lng: number) => ({
      lat,
      lng,
    })),
    Control: class {
      onAdd?: () => HTMLElement;

      addTo = vi.fn().mockReturnThis();
    },
    DomUtil: {
      create: vi.fn().mockImplementation((tagName: string) =>
        document.createElement(tagName),
      ),
    },
    DomEvent: domEvent,
  };
});

interface MapMock {
  setView: ReturnType<typeof vi.fn>;
  getCenter: ReturnType<typeof vi.fn>;
  invalidateSize?: ReturnType<typeof vi.fn>;
  attributionControl?: {
    setPrefix: ReturnType<typeof vi.fn>;
    setPosition: ReturnType<typeof vi.fn>;
  };
  zoomControl?: {
    setPosition: ReturnType<typeof vi.fn>;
  };
}

interface LayerMock {
  clearLayers: ReturnType<typeof vi.fn>;
}

interface MarkerMock {
  setLatLng?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
}

interface LatLngMock {
  lat: number;
  lng: number;
}

interface PinMock {
  options: {
    html?: string;
  };
}

interface LocationSuggestionMock {
  displayName: string;
  lat: number;
  lng: number;
}

interface PlaceMock {
  name: string;
  lat: number;
  lng: number;
  distance?: number;
}

interface ProfileMock {
  photoUrl: string;
}

interface ReportListServiceMock {
  getGenerales: ReturnType<typeof vi.fn>;
  getMisReportes: ReturnType<typeof vi.fn>;
}

interface ProfileServiceMock {
  getProfile: ReturnType<typeof vi.fn>;
}

interface RouterMock {
  navigate: ReturnType<typeof vi.fn>;
}

interface NotificationServiceMock {
  busy: ReturnType<typeof signal<boolean>>;
  permission: ReturnType<typeof signal<NotificationPermission>>;
  active: ReturnType<typeof signal<boolean>>;
  isSupported: ReturnType<typeof vi.fn>;
  enable: ReturnType<typeof vi.fn>;
}

interface HomeMapComponentTest {
  map: MapMock;
  lugaresLayer: LayerMock;
  userLatLng?: LatLngMock;
  userMarker?: MarkerMock;
  searchMarker?: MarkerMock;
  profilePhotoUrl: string;
  dibujarMarcadores: (reportes: Reporte[]) => void;
  markSearchResult: (lat: number, lng: number) => void;
  fetchSuggestions: () => Promise<void>;
  formatBadge: (n: number) => string;
  calcularDistancia: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => number;
  direccionCorta: (address: string) => string;
  fechaPopup: (date: string) => string;
  horaPopup: (date: string) => string;
  nombrePopup: (reporte: Reporte, nombre?: string) => string;
  tiempoPopup: (fecha: string) => string;
  fallbackIconFor: (reporte: Reporte) => string;
  buildPopup: (reporte: Reporte) => string;
  cargarReportes: () => Promise<void>;
  initializeMap: () => void;
  buscarLugares: (tipo: 'veterinary' | 'police') => Promise<void>;
  dibujarLugares: () => void;
  dibujarLugar: (lugar: unknown, icon: unknown) => void;
  centerOnUser: () => void;
  getUserLocation: () => void;
  placeUserMarker: () => void;
  buildPin: (
    color: string,
    imageUrl?: string,
    fallbackIcon?: string,
  ) => PinMock;
}

interface MockReporteOptions extends Partial<Omit<Reporte, 'details'>> {
  details?: Record<string, unknown>;
}

const mockReporte = (overrides: MockReporteOptions = {}): Reporte =>
  ({
    publicId: 'rep-1',
    type: 'LOST',
    status: 'ACTIVE',
    description: 'Descripción',
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

const mockSuggestion = (
  overrides: Partial<LocationSuggestionMock> = {},
): LocationSuggestionMock => ({
  displayName: 'Buenos Aires',
  lat: -34.6037,
  lng: -58.3816,
  ...overrides,
});

const mockPlace = (overrides: Partial<PlaceMock> = {}): PlaceMock => ({
  name: 'Veterinaria',
  lat: -34.6,
  lng: -58.3,
  distance: 1.2,
  ...overrides,
});

const mockMap = (): MapMock => ({
  setView: vi.fn(),
  getCenter: vi.fn().mockReturnValue({
    lat: -34.6037,
    lng: -58.3816,
  }),
  invalidateSize: vi.fn(),
  attributionControl: {
    setPrefix: vi.fn(),
    setPosition: vi.fn(),
  },
  zoomControl: {
    setPosition: vi.fn(),
  },
});

const mockLayer = (): LayerMock => ({
  clearLayers: vi.fn(),
});

const mockFetchJson = (data: unknown): void => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response);
};

describe('HomeMapComponent', () => {
  let reportListService: ReportListServiceMock;
  let profileService: ProfileServiceMock;
  let notificationService: NotificationServiceMock;
  let router: RouterMock;
  let component: HomeMapComponent;

  const testingComponent = (): HomeMapComponentTest =>
    component as unknown as HomeMapComponentTest;

  const mockDibujarMarcadores = (): void => {
    vi.spyOn(testingComponent(), 'dibujarMarcadores').mockImplementation(
      (): void => undefined,
    );
  };

  const mockDibujarLugares = (): void => {
    vi.spyOn(testingComponent(), 'dibujarLugares').mockImplementation(
      (): void => undefined,
    );
  };

  beforeEach(() => {
    reportListService = {
      getGenerales: vi.fn(),
      getMisReportes: vi.fn(),
    };

    profileService = {
      getProfile: vi.fn(),
    };

    notificationService = {
      busy: signal(false),
      permission: signal('default'),
      active: signal(false),
      isSupported: vi.fn().mockReturnValue(true),
      enable: vi.fn().mockResolvedValue(undefined),
    };

    router = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HomeMapComponent],
      providers: [
        {
          provide: ReportListService,
          useValue: reportListService,
        },
        {
          provide: ProfileService,
          useValue: profileService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: vi.fn().mockReturnValue(null),
              },
            },
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    const fixture = TestBed.createComponent(HomeMapComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should create component without running lifecycle hooks', () => {
    expect(component).toBeTruthy();
  });

  describe('applyFilters', () => {
    it('filters lost reports', () => {
      component.reportes.set([
        mockReporte({ publicId: '1', type: 'LOST' }),
        mockReporte({ publicId: '2', type: 'SIGHTING' }),
      ]);

      component.tipoFiltro.set('perdidos');
      mockDibujarMarcadores();

      component.aplicarFiltros();

      expect(component.reportesFiltrados()).toHaveLength(1);
      expect(component.reportesFiltrados()[0]?.publicId).toBe('1');
    });

    it('filters sighting reports', () => {
      component.reportes.set([
        mockReporte({ publicId: '1', type: 'LOST' }),
        mockReporte({ publicId: '2', type: 'SIGHTING' }),
      ]);

      component.tipoFiltro.set('avistados');
      mockDibujarMarcadores();

      component.aplicarFiltros();

      expect(component.reportesFiltrados()).toHaveLength(1);
      expect(component.reportesFiltrados()[0]?.publicId).toBe('2');
    });

    it('filters dog reports', () => {
      component.reportes.set([
        mockReporte({
          publicId: '1',
          details: { animalType: 'DOG', images: [] },
        }),
        mockReporte({
          publicId: '2',
          details: { animalType: 'CAT', images: [] },
        }),
      ]);

      component.mascotaFiltro.set('perro');
      mockDibujarMarcadores();

      component.aplicarFiltros();

      expect(component.reportesFiltrados()).toHaveLength(1);
      expect(component.reportesFiltrados()[0]?.publicId).toBe('1');
    });

    it('filters cat reports', () => {
      component.reportes.set([
        mockReporte({
          publicId: '1',
          details: { animalType: 'DOG', images: [] },
        }),
        mockReporte({
          publicId: '2',
          details: { animalType: 'CAT', images: [] },
        }),
      ]);

      component.mascotaFiltro.set('gato');
      mockDibujarMarcadores();

      component.aplicarFiltros();

      expect(component.reportesFiltrados()).toHaveLength(1);
      expect(component.reportesFiltrados()[0]?.publicId).toBe('2');
    });

    it('does not filter reports when all filters are selected', () => {
      component.reportes.set([
        mockReporte({ publicId: '1', type: 'LOST' }),
        mockReporte({
          publicId: '2',
          type: 'SIGHTING',
          details: { animalType: 'CAT', isInTransit: false, images: [] },
        }),
      ]);

      component.tipoFiltro.set('todos');
      component.mascotaFiltro.set('todos');
      component.cercaniaFiltro.set('todos');
      mockDibujarMarcadores();

      component.aplicarFiltros();

      expect(component.reportesFiltrados()).toHaveLength(2);
    });

    it('filters reports by distance', () => {
      component.reportes.set([
        mockReporte({
          publicId: 'near',
          location: {
            address: 'Cerca',
            latitude: -34.6037,
            longitude: -58.3816,
          },
        }),
        mockReporte({
          publicId: 'far',
          location: {
            address: 'Lejos',
            latitude: -35.6037,
            longitude: -59.3816,
          },
        }),
      ]);

      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      component.cercaniaFiltro.set('5km');
      mockDibujarMarcadores();

      component.aplicarFiltros();

      expect(component.reportesFiltrados()).toHaveLength(1);
      expect(component.reportesFiltrados()[0]?.publicId).toBe('near');
    });
  });

  describe('clearSearch', () => {
    it('clears search term and suggestions', () => {
      component.searchTerm.set('Buenos Aires');
      component.suggestions.set([mockSuggestion()]);

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.suggestions()).toEqual([]);
    });
  });

  describe('selectSuggestion', () => {
    it('updates search term and clears suggestions', () => {
      const suggestion = mockSuggestion({
        displayName: 'La Plata',
        lat: -34.9,
        lng: -57.9,
      });

      component.suggestions.set([suggestion]);
      testingComponent().map = mockMap();

      vi.spyOn(testingComponent(), 'markSearchResult').mockImplementation(
        (): void => undefined,
      );

      component.selectSuggestion(suggestion);

      expect(component.searchTerm()).toBe('La Plata');
      expect(component.suggestions()).toEqual([]);
      expect(testingComponent().map.setView).toHaveBeenCalledWith(
        [-34.9, -57.9],
        15,
      );
    });
  });

  describe('searchLocation', () => {
    it('selects the first existing suggestion', async () => {
      const suggestion = mockSuggestion();
      component.suggestions.set([suggestion]);

      vi.spyOn(component, 'selectSuggestion').mockImplementation(
        (): void => undefined,
      );

      await component.searchLocation();

      expect(component.selectSuggestion).toHaveBeenCalledWith(suggestion);
    });

    it('does nothing when there are no suggestions after fetching', async () => {
      component.suggestions.set([]);

      vi.spyOn(testingComponent(), 'fetchSuggestions').mockResolvedValue(
        undefined,
      );

      vi.spyOn(component, 'selectSuggestion').mockImplementation(
        (): void => undefined,
      );

      await component.searchLocation();

      expect(component.selectSuggestion).not.toHaveBeenCalled();
    });

    it('fetches suggestions when there are none loaded', async () => {
      component.suggestions.set([]);

      const fetchSuggestionsSpy = vi
        .spyOn(testingComponent(), 'fetchSuggestions')
        .mockResolvedValue(undefined);

      await component.searchLocation();

      expect(fetchSuggestionsSpy).toHaveBeenCalled();
    });
  });

  describe('closeSuccess', () => {
    it('clears success report id', () => {
      component.successReportId.set('report-123');

      component.closeSuccess();

      expect(component.successReportId()).toBeNull();
    });

    it('navigates removing query params', () => {
      component.successReportId.set('report-123');

      component.closeSuccess();

      expect(router.navigate).toHaveBeenCalledWith([], {
        queryParams: {},
        replaceUrl: true,
      });
    });
  });

  describe('verReporte', () => {
    it('navigates to report detail', () => {
      component.successReportId.set('report-123');

      component.verReporte();

      expect(router.navigate).toHaveBeenCalledWith([
        '/reports',
        'report-123',
      ]);
    });

    it('clears success report id after navigation', () => {
      component.successReportId.set('report-123');

      component.verReporte();

      expect(component.successReportId()).toBeNull();
    });
  });

  describe('irALugar', () => {
    it('moves the map to the selected place', () => {
      testingComponent().map = mockMap();

      component.irALugar(-34.6037, -58.3816);

      expect(testingComponent().map.setView).toHaveBeenCalledWith(
        [-34.6037, -58.3816],
        18,
      );
    });
  });

  describe('formatBadge', () => {
    it('returns the number as text when it is less than or equal to ten', () => {
      const result = testingComponent().formatBadge(10);

      expect(result).toBe('10');
    });

    it('returns +10 when the number is greater than ten', () => {
      const result = testingComponent().formatBadge(11);

      expect(result).toBe('+10');
    });

    it('returns zero as text', () => {
      const result = testingComponent().formatBadge(0);

      expect(result).toBe('0');
    });
  });

  describe('calcularDistancia', () => {
    it('returns zero when both points are the same', () => {
      const result = testingComponent().calcularDistancia(
        -34.6037,
        -58.3816,
        -34.6037,
        -58.3816,
      );

      expect(result).toBe(0);
    });

    it('returns a positive distance when points are different', () => {
      const result = testingComponent().calcularDistancia(
        -34.6037,
        -58.3816,
        -34.62,
        -58.4,
      );

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('onSearchInput', () => {
    it('updates search term', () => {
      component.onSearchInput('Buenos Aires');

      expect(component.searchTerm()).toBe('Buenos Aires');
    });

    it('clears suggestions when the search text has less than three characters', () => {
      component.suggestions.set([mockSuggestion()]);

      component.onSearchInput('Bo');

      expect(component.suggestions()).toEqual([]);
    });

    it('fetches suggestions after debounce when the search text has at least three characters', () => {
      vi.useFakeTimers();

      const fetchSuggestionsSpy = vi
        .spyOn(testingComponent(), 'fetchSuggestions')
        .mockResolvedValue(undefined);

      component.onSearchInput('Buenos Aires');
      vi.advanceTimersByTime(350);

      expect(fetchSuggestionsSpy).toHaveBeenCalled();
    });
  });

  describe('direccionCorta', () => {
    it('returns "Sin ubicación" when address is empty', () => {
      const result = testingComponent().direccionCorta('');

      expect(result).toBe('Sin ubicación');
    });

    it('returns street and number when address starts with a number', () => {
      const result = testingComponent().direccionCorta(
        '123, Avenida Corrientes, Buenos Aires',
      );

      expect(result).toBe('Avenida Corrientes 123');
    });

    it('returns the first address part when address does not start with a number', () => {
      const result = testingComponent().direccionCorta(
        'Avenida Corrientes 123, Buenos Aires',
      );

      expect(result).toBe('Avenida Corrientes 123');
    });

    it('returns address when it has no commas', () => {
      const result = testingComponent().direccionCorta(
        'Avenida Corrientes 123',
      );

      expect(result).toBe('Avenida Corrientes 123');
    });
  });

  describe('fechaPopup', () => {
    it('formats a valid date', () => {
      const result = testingComponent().fechaPopup(
        '2026-06-01T10:00:00.000Z',
      );

      expect(result).toContain('2026');
    });

    it('returns "Sin fecha" when date is invalid', () => {
      const result = testingComponent().fechaPopup('invalid-date');

      expect(result).toBe('Sin fecha');
    });
  });

  describe('horaPopup', () => {
    it('formats a valid time', () => {
      const result = testingComponent().horaPopup(
        '2026-06-01T10:30:00.000Z',
      );

      expect(result).toContain('hs');
    });

    it('returns empty text when date is invalid', () => {
      const result = testingComponent().horaPopup('invalid-date');

      expect(result).toBe('');
    });
  });

  describe('nombrePopup', () => {
    it('returns the provided name when it exists', () => {
      const result = testingComponent().nombrePopup(
        mockReporte(),
        'Firulais',
      );

      expect(result).toBe('Firulais');
    });

    it('returns "Perro perdido" for lost dog reports without name', () => {
      const result = testingComponent().nombrePopup(
        mockReporte({
          type: 'LOST',
          details: { animalType: 'DOG', images: [] },
        }),
        undefined,
      );

      expect(result).toBe('Perro perdido');
    });

    it('returns "Gato perdido" for lost cat reports without name', () => {
      const result = testingComponent().nombrePopup(
        mockReporte({
          type: 'LOST',
          details: { animalType: 'CAT', images: [] },
        }),
        undefined,
      );

      expect(result).toBe('Gato perdido');
    });

    it('returns "Perro avistado" for dog sightings', () => {
      const result = testingComponent().nombrePopup(
        mockReporte({
          type: 'SIGHTING',
          details: {
            animalType: 'DOG',
            isInTransit: false,
            images: [],
          },
        }),
        undefined,
      );

      expect(result).toBe('Perro avistado');
    });

    it('returns "Perro en tránsito" for dog sightings in transit', () => {
      const result = testingComponent().nombrePopup(
        mockReporte({
          type: 'SIGHTING',
          details: {
            animalType: 'DOG',
            isInTransit: true,
            images: [],
          },
        }),
        undefined,
      );

      expect(result).toBe('Perro en tránsito');
    });
  });

  describe('tiempoPopup', () => {
    it('returns "Hace instantes" for reports less than one hour old', () => {
      const fecha = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const result = testingComponent().tiempoPopup(fecha);

      expect(result).toBe('Hace instantes');
    });

    it('returns hours for reports less than one day old', () => {
      const fecha = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      const result = testingComponent().tiempoPopup(fecha);

      expect(result).toBe('Hace 3hs');
    });

    it('returns days for reports older than one day', () => {
      const fecha = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const result = testingComponent().tiempoPopup(fecha);

      expect(result).toBe('Hace 2d');
    });

    it('returns one hour text', () => {
      const fecha = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const result = testingComponent().tiempoPopup(fecha);

      expect(result).toContain('1');
    });
  });

  describe('fallbackIconFor', () => {
    it('returns the lost pet icon for lost reports', () => {
      const result = testingComponent().fallbackIconFor(
        mockReporte({ type: 'LOST' }),
      );

      expect(result).toBe('Icono-mascota-perdida.png');
    });

    it('returns the in-transit sighting icon for sightings in transit', () => {
      const result = testingComponent().fallbackIconFor(
        mockReporte({
          type: 'SIGHTING',
          details: {
            animalType: 'DOG',
            isInTransit: true,
            images: [],
          },
        }),
      );

      expect(result).toBe('Icono-avistamiento-transito.png');
    });

    it('returns the non-transit sighting icon for sightings not in transit', () => {
      const result = testingComponent().fallbackIconFor(
        mockReporte({
          type: 'SIGHTING',
          details: {
            animalType: 'DOG',
            isInTransit: false,
            images: [],
          },
        }),
      );

      expect(result).toBe('Icono-avistamiento-sin-transito.png');
    });
  });

  describe('buildPopup', () => {
    it('includes the report name in the popup html', () => {
      const reporte = mockReporte({
        details: {
          name: 'Firulais',
          animalType: 'DOG',
          images: [],
        },
      });

      const result = testingComponent().buildPopup(reporte);

      expect(result).toContain('Firulais');
    });

    it('includes the report detail link', () => {
      const reporte = mockReporte({ publicId: 'rep-123' });

      const result = testingComponent().buildPopup(reporte);

      expect(result).toContain('/reports/rep-123');
    });

    it('shows the lost pet badge text for lost reports', () => {
      const result = testingComponent().buildPopup(
        mockReporte({ type: 'LOST' }),
      );

      expect(result).toContain('Mascota perdida');
    });

    it('shows the sighting badge text for sighting reports', () => {
      const reporte = mockReporte({
        type: 'SIGHTING',
        details: {
          animalType: 'DOG',
          isInTransit: false,
          images: [],
        },
      });

      const result = testingComponent().buildPopup(reporte);

      expect(result).toContain('Mascota avistada');
    });
  });

  describe('ngOnInit', () => {
    it('sets success report id when report query param exists', async () => {
      TestBed.inject(ActivatedRoute).snapshot.queryParamMap.get =
        vi.fn().mockReturnValue('report-123');

      profileService.getProfile.mockResolvedValue({
        photoUrl: 'https://image.com/profile.jpg',
      } as ProfileMock);

      await component.ngOnInit();

      expect(component.successReportId()).toBe('report-123');
    });

    it('loads profile photo when profile has photo url', async () => {
      profileService.getProfile.mockResolvedValue({
        photoUrl: 'https://image.com/profile.jpg',
      } as ProfileMock);

      await component.ngOnInit();

      expect(testingComponent().profilePhotoUrl).toBe(
        'https://image.com/profile.jpg',
      );
    });

    it('keeps default profile photo when profile has no photo url', async () => {
      profileService.getProfile.mockResolvedValue({
        photoUrl: '',
      } as ProfileMock);

      await component.ngOnInit();

      expect(testingComponent().profilePhotoUrl).toContain('ui-avatars.com');
    });

    it('does not throw when profile loading fails', async () => {
      profileService.getProfile.mockRejectedValue(new Error('Profile error'));

      const action = component.ngOnInit();

      await expect(action).resolves.not.toThrow();
    });
  });

  describe('cargarReportes', () => {
    it('loads reports and updates counters', async () => {
      const reportes = [
        mockReporte({ publicId: 'r1' }),
        mockReporte({ publicId: 'r2' }),
      ];

      const misReportes = [
        mockReporte({ publicId: 'm1', status: 'ACTIVE' }),
        mockReporte({ publicId: 'm2', status: 'ACTIVE' }),
        mockReporte({ publicId: 'm3', status: 'RESOLVED' }),
        mockReporte({ publicId: 'm4', status: 'CLOSED' }),
      ];

      reportListService.getGenerales.mockResolvedValue(reportes);
      reportListService.getMisReportes.mockResolvedValue(misReportes);
      mockDibujarMarcadores();

      await testingComponent().cargarReportes();

      expect(reportListService.getGenerales).toHaveBeenCalledWith({
        status: 'ACTIVE',
      });
      expect(component.reportes()).toEqual(reportes);
      expect(component.reportesFiltrados()).toEqual(reportes);
      expect(component.totalMisReportes()).toBe(2);
      expect(component.misReportes()).toHaveLength(2);
      expect(component.totalCercanos()).toBe(2);
      expect(component.reportesCercanos()).toHaveLength(2);
    });

    it('shows only reports within the radar radius when the user location is known', async () => {
      reportListService.getGenerales.mockResolvedValue([
        mockReporte({
          publicId: 'near',
          location: {
            address: 'Cerca',
            latitude: -34.6037,
            longitude: -58.3816,
          },
        }),
        mockReporte({
          publicId: 'far',
          location: {
            address: 'Lejos',
            latitude: -35.6037,
            longitude: -59.3816,
          },
        }),
      ]);
      reportListService.getMisReportes.mockResolvedValue([]);

      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };
      mockDibujarMarcadores();

      await testingComponent().cargarReportes();

      expect(component.reportesFiltrados()).toHaveLength(1);
      expect(component.reportesFiltrados()[0]?.publicId).toBe('near');
    });

    it('does not throw when report loading fails', async () => {
      reportListService.getGenerales.mockRejectedValue(
        new Error('Backend error'),
      );

      const action = testingComponent().cargarReportes();

      await expect(action).resolves.toBeUndefined();
    });
  });

  describe('aplicarFiltroCentros', () => {
    it('searches veterinary places when veterinary filter is selected', async () => {
      component.centrosFiltro.set('veterinarias');

      const buscarLugaresSpy = vi
        .spyOn(testingComponent(), 'buscarLugares')
        .mockResolvedValue(undefined);

      await component.aplicarFiltroCentros();

      expect(buscarLugaresSpy).toHaveBeenCalledWith('veterinary');
    });

    it('searches police places when police filter is selected', async () => {
      component.centrosFiltro.set('comisarias');

      const buscarLugaresSpy = vi
        .spyOn(testingComponent(), 'buscarLugares')
        .mockResolvedValue(undefined);

      await component.aplicarFiltroCentros();

      expect(buscarLugaresSpy).toHaveBeenCalledWith('police');
    });

    it('clears places when all centers filter is selected', async () => {
      component.centrosFiltro.set('todos');
      component.lugares.set([mockPlace()]);
      testingComponent().lugaresLayer = mockLayer();

      await component.aplicarFiltroCentros();

      expect(component.lugares()).toEqual([]);
      expect(testingComponent().lugaresLayer.clearLayers).toHaveBeenCalled();
      expect(component.centrosCargando()).toBe(false);
    });
  });

  describe('buscarLugares', () => {
    it('uses map center when user location does not exist', async () => {
      testingComponent().userLatLng = undefined;
      testingComponent().map = mockMap();

      mockFetchJson({
        elements: [
          {
            type: 'node',
            id: 1,
            tags: {
              name: 'Veterinaria Central',
            },
            lat: -34.604,
            lon: -58.382,
          },
        ],
      });

      mockDibujarLugares();

      await testingComponent().buscarLugares('veterinary');

      expect(globalThis.fetch).toHaveBeenCalled();
      expect(component.lugares()[0]?.name).toBe('Veterinaria Central');
    });

    it('loads nearby veterinary places', async () => {
      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      mockFetchJson({
        elements: [
          {
            type: 'node',
            id: 1,
            tags: {
              name: 'Veterinaria Central',
            },
            lat: -34.604,
            lon: -58.382,
          },
        ],
      });

      mockDibujarLugares();

      await testingComponent().buscarLugares('veterinary');

      expect(component.lugares()).toEqual([
        {
          name: 'Veterinaria Central',
          lat: -34.604,
          lng: -58.382,
          distance: expect.any(Number),
        },
      ]);
    });

    it('loads nearby places using center when element is a way', async () => {
      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      mockFetchJson({
        elements: [
          {
            type: 'way',
            id: 10,
            tags: {
              name: 'Veterinaria de Barrio',
            },
            center: {
              lat: -34.605,
              lon: -58.383,
            },
          },
        ],
      });

      mockDibujarLugares();

      await testingComponent().buscarLugares('veterinary');

      expect(component.lugares()).toEqual([
        {
          name: 'Veterinaria de Barrio',
          lat: -34.605,
          lng: -58.383,
          distance: expect.any(Number),
        },
      ]);
    });

    it('uses default police name when place has no name', async () => {
      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      mockFetchJson({
        elements: [
          {
            type: 'node',
            id: 1,
            tags: {},
            lat: -34.604,
            lon: -58.382,
          },
        ],
      });

      mockDibujarLugares();

      await testingComponent().buscarLugares('police');

      expect(component.lugares()[0]?.name).toBe('Dependencia policial');
    });

    it('uses default veterinary name when place has no name', async () => {
      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      mockFetchJson({
        elements: [
          {
            type: 'node',
            id: 1,
            tags: {},
            lat: -34.604,
            lon: -58.382,
          },
        ],
      });

      mockDibujarLugares();

      await testingComponent().buscarLugares('veterinary');

      expect(component.lugares()[0]?.name).toBe('Centro veterinario');
    });

    it('clears places and sets error when nearby places request fails', async () => {
      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      component.lugares.set([mockPlace()]);
      testingComponent().lugaresLayer = mockLayer();

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new Error('Network error'),
      );

      const action = testingComponent().buscarLugares('veterinary');

      await expect(action).resolves.toBeUndefined();
      expect(component.lugares()).toEqual([]);
      expect(testingComponent().lugaresLayer.clearLayers).toHaveBeenCalled();
      expect(component.centrosError()).toBe(
        'No se pudieron cargar los centros cercanos. Intentá nuevamente.',
      );
    });

    it('sets an error when response has no places', async () => {
      testingComponent().userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      mockFetchJson({
        elements: [],
      });

      mockDibujarLugares();

      await testingComponent().buscarLugares('veterinary');

      expect(component.lugares()).toEqual([]);
      expect(component.centrosError()).toBe(
        'No se encontraron centros cercanos en OpenStreetMap.',
      );
    });
  });

  describe('centerOnUser', () => {
    it('centers the map when user location exists', () => {
      const userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      testingComponent().userLatLng = userLatLng;
      testingComponent().map = mockMap();

      testingComponent().centerOnUser();

      expect(testingComponent().map.setView).toHaveBeenCalledWith(
        userLatLng,
        16,
      );
    });

    it('tries to get user location when user location does not exist', () => {
      testingComponent().userLatLng = undefined;

      const getUserLocationSpy = vi
        .spyOn(testingComponent(), 'getUserLocation')
        .mockImplementation((): void => undefined);

      testingComponent().centerOnUser();

      expect(getUserLocationSpy).toHaveBeenCalled();
    });
  });

  describe('placeUserMarker', () => {
    it('does nothing when user location does not exist', () => {
      testingComponent().userLatLng = undefined;

      testingComponent().placeUserMarker();

      expect(testingComponent().userMarker).toBeUndefined();
    });

    it('updates existing user marker position', () => {
      const userLatLng = {
        lat: -34.6037,
        lng: -58.3816,
      };

      const userMarker = {
        setLatLng: vi.fn(),
      };

      testingComponent().userLatLng = userLatLng;
      testingComponent().userMarker = userMarker;

      testingComponent().placeUserMarker();

      expect(userMarker.setLatLng).toHaveBeenCalledWith(userLatLng);
    });
  });

  describe('markSearchResult', () => {
    it('updates existing search marker position', () => {
      const searchMarker = {
        setLatLng: vi.fn(),
      };

      testingComponent().searchMarker = searchMarker;

      testingComponent().markSearchResult(-34.6037, -58.3816);

      expect(searchMarker.setLatLng).toHaveBeenCalled();
    });
  });

  describe('clearSearch with marker', () => {
    it('removes search marker when it exists', () => {
      const searchMarker = {
        remove: vi.fn(),
      };

      testingComponent().searchMarker = searchMarker;
      component.searchTerm.set('Buenos Aires');

      component.clearSearch();

      expect(searchMarker.remove).toHaveBeenCalled();
      expect(testingComponent().searchMarker).toBeUndefined();
    });
  });

  describe('buildPin', () => {
    it('creates a pin with image when image url exists', () => {
      const result = testingComponent().buildPin(
        '#E8842E',
        'https://image.com/dog.jpg',
      );

      expect(result.options.html).toContain('dog.jpg');
    });

    it('creates a pin with fallback icon when image does not exist', () => {
      const result = testingComponent().buildPin(
        '#E8842E',
        undefined,
        'Icono-mascota-perdida.png',
      );

      expect(result.options.html).toContain('Icono-mascota-perdida.png');
    });

    it('creates a pin without image content when no image or fallback exists', () => {
      const result = testingComponent().buildPin('#E8842E');

      expect(result.options.html).not.toContain('<img');
    });
  });

  describe('dibujarLugares', () => {
    it('clears previous places layer', () => {
      testingComponent().lugaresLayer = mockLayer();
      component.lugares.set([]);

      testingComponent().dibujarLugares();

      expect(testingComponent().lugaresLayer.clearLayers).toHaveBeenCalled();
    });

    it('draws a centro pin for each nearby place', () => {
      testingComponent().lugaresLayer = mockLayer();
      component.lugares.set([mockPlace()]);
      const dibujarLugarSpy = vi.spyOn(testingComponent(), 'dibujarLugar');

      testingComponent().dibujarLugares();

      expect(dibujarLugarSpy).toHaveBeenCalledOnce();
    });
  });

  describe('getUserLocation', () => {
    it('sets user location and centers the map when geolocation succeeds', () => {
      vi.useFakeTimers();

      const placeUserMarkerSpy = vi
        .spyOn(testingComponent(), 'placeUserMarker')
        .mockImplementation((): void => undefined);

      testingComponent().map = mockMap();

      const getCurrentPosition = vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: -34.6037,
            longitude: -58.3816,
          },
        });
      });

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition,
        },
      });

      testingComponent().getUserLocation();
      vi.advanceTimersByTime(100);

      expect(testingComponent().userLatLng?.lat).toBe(-34.6037);
      expect(testingComponent().userLatLng?.lng).toBe(-58.3816);
      expect(placeUserMarkerSpy).toHaveBeenCalled();
      expect(testingComponent().map.setView).toHaveBeenCalledWith(
        testingComponent().userLatLng,
        15,
      );
      expect(testingComponent().map.invalidateSize).toHaveBeenCalled();
    });

    it('centers the map on default location when geolocation fails', () => {
      vi.useFakeTimers();

      testingComponent().map = mockMap();

      const getCurrentPosition = vi.fn().mockImplementation((_success, error) => {
        error();
      });

      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition,
        },
      });

      testingComponent().getUserLocation();
      vi.advanceTimersByTime(100);

      expect(testingComponent().map.setView).toHaveBeenCalledWith(
        [-34.603734, -58.38157],
        13,
      );
      expect(testingComponent().map.invalidateSize).toHaveBeenCalled();
    });
  });

  describe('fetchSuggestions', () => {
    it('clears suggestions when request fails', async () => {
      component.searchTerm.set('Buenos Aires');

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new Error('Network error'),
      );

      await testingComponent().fetchSuggestions();

      expect(component.suggestions()).toEqual([]);
    });

    it('does nothing when search term is empty', async () => {
      component.searchTerm.set('');

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      fetchSpy.mockClear();

      await testingComponent().fetchSuggestions();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('loads and maps location suggestions', async () => {
      component.searchTerm.set('Buenos Aires');

      mockFetchJson([
        {
          display_name: 'Buenos Aires, Argentina',
          lat: '-34.6037',
          lon: '-58.3816',
        },
      ]);

      await testingComponent().fetchSuggestions();

      expect(component.suggestions()).toEqual([
        {
          displayName: 'Buenos Aires, Argentina',
          lat: -34.6037,
          lng: -58.3816,
        },
      ]);
    });
  });

  describe('initializeMap', () => {
    it('creates the map, adds layers, gets user location and loads reports', () => {
      vi.useFakeTimers();

      const getUserLocationSpy = vi
        .spyOn(testingComponent(), 'getUserLocation')
        .mockImplementation((): void => undefined);

      const cargarReportesSpy = vi
        .spyOn(testingComponent(), 'cargarReportes')
        .mockResolvedValue(undefined);

      testingComponent().initializeMap();
      vi.advanceTimersByTime(500);

      expect(getUserLocationSpy).toHaveBeenCalled();
      expect(cargarReportesSpy).toHaveBeenCalled();
    });
  });

  describe('dibujarMarcadores', () => {
    it('uses orange color for lost reports', () => {
      const reporte = mockReporte({ type: 'LOST' });

      const buildPinSpy = vi.spyOn(testingComponent(), 'buildPin');

      testingComponent().dibujarMarcadores([reporte]);

      expect(buildPinSpy).toHaveBeenCalledWith(
        '#E8842E',
        undefined,
        'Icono-mascota-perdida.png',
      );
    });

    it('uses blue color for sighting reports', () => {
      const reporte = mockReporte({
        type: 'SIGHTING',
        details: {
          animalType: 'DOG',
          isInTransit: false,
          images: [],
        },
      });

      const buildPinSpy = vi.spyOn(testingComponent(), 'buildPin');

      testingComponent().dibujarMarcadores([reporte]);

      expect(buildPinSpy).toHaveBeenCalledWith(
        '#12355B',
        undefined,
        'Icono-avistamiento-sin-transito.png',
      );
    });

    it('uses the first report image when it exists', () => {
      const reporte = mockReporte({
        details: {
          animalType: 'DOG',
          images: [{ url: 'https://image.com/pet.jpg' }],
        },
      });

      const buildPinSpy = vi.spyOn(testingComponent(), 'buildPin');

      testingComponent().dibujarMarcadores([reporte]);

      expect(buildPinSpy).toHaveBeenCalledWith(
        '#E8842E',
        'https://image.com/pet.jpg',
        'Icono-mascota-perdida.png',
      );
    });
  });
});
