import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeMapComponent } from './home-map';
import { ReportListService } from '../report/application/report-list.service';
import { ProfileService } from '../profile/application/profile.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('HomeMapComponent', () => {
  let reportListService: {
    getGenerales: ReturnType<typeof vi.fn>;
    getMisReportes: ReturnType<typeof vi.fn>;
  };

  let profileService: {
    getProfile: ReturnType<typeof vi.fn>;
  };
    let router: {
    navigate: ReturnType<typeof vi.fn>;
    };
  let component: HomeMapComponent;

  beforeEach(() => {
    reportListService = {
      getGenerales: vi.fn(),
      getMisReportes: vi.fn(),
    };

    profileService = {
      getProfile: vi.fn(),
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

  it('should create component without running lifecycle hooks', () => {
  expect(component).toBeTruthy();
});

describe('applyFilters', () => {

  it('filters lost reports', () => {

    // Given
    component.reportes.set([
      {
        publicId: '1',
        type: 'LOST',
        details: { animalType: 'DOG' },
      } as any,
      {
        publicId: '2',
        type: 'SIGHTING',
        details: { animalType: 'DOG' },
      } as any,
    ]);

    component.tipoFiltro.set('perdidos');

    // When
    vi.spyOn(component as any, 'dibujarMarcadores').mockImplementation(() => {});
    component.aplicarFiltros();

    // Then
    expect(component.reportesFiltrados()).toHaveLength(1);
    expect(component.reportesFiltrados()[0].publicId).toBe('1');
  });

  it('filters sighting reports', () => {

    // Given
    component.reportes.set([
      {
        publicId: '1',
        type: 'LOST',
      } as any,
      {
        publicId: '2',
        type: 'SIGHTING',
      } as any,
    ]);

    component.tipoFiltro.set('avistados');

    // When
    vi.spyOn(component as any, 'dibujarMarcadores').mockImplementation(() => {});
    component.aplicarFiltros();

    // Then
    expect(component.reportesFiltrados()).toHaveLength(1);
    expect(component.reportesFiltrados()[0].publicId).toBe('2');
  });

});

describe('applyFilters', () => {

  it('filters dog reports', () => {

  // Given
  component.reportes.set([
    {
      publicId: '1',
      type: 'LOST',
      details: { animalType: 'DOG' },
    } as any,
    {
      publicId: '2',
      type: 'LOST',
      details: { animalType: 'CAT' },
    } as any,
  ]);

  component.mascotaFiltro.set('perro');

  // When
  vi.spyOn(component as any, 'dibujarMarcadores').mockImplementation(() => {});
  component.aplicarFiltros();

  // Then
  expect(component.reportesFiltrados()).toHaveLength(1);
  expect(component.reportesFiltrados()[0].publicId).toBe('1');
});

  it('filters cat reports', () => {

  // Given
  component.reportes.set([
    {
      publicId: '1',
      type: 'LOST',
      details: {
        animalType: 'DOG',
      },
    } as any,
    {
      publicId: '2',
      type: 'LOST',
      details: {
        animalType: 'CAT',
      },
    } as any,
  ]);

  component.mascotaFiltro.set('gato');

  // When
  vi.spyOn(component as any, 'dibujarMarcadores')
    .mockImplementation(() => {});

  component.aplicarFiltros();

  // Then
  expect(component.reportesFiltrados()).toHaveLength(1);
  expect(component.reportesFiltrados()[0].publicId).toBe('2');
});

  it('does not filter reports when all filters are selected', () => {

  // Given
  component.reportes.set([
    {
      publicId: '1',
      type: 'LOST',
      details: { animalType: 'DOG' },
    } as any,
    {
      publicId: '2',
      type: 'SIGHTING',
      details: { animalType: 'CAT' },
    } as any,
  ]);

  component.tipoFiltro.set('todos');
  component.mascotaFiltro.set('todos');
  component.cercaniaFiltro.set('todos');

  // When
  vi.spyOn(component as any, 'dibujarMarcadores')
    .mockImplementation(() => {});

  component.aplicarFiltros();

  // Then
  expect(component.reportesFiltrados()).toHaveLength(2);
});

  it('filters reports by distance', () => {

  // Given
  component.reportes.set([
    {
      publicId: 'near',
      type: 'LOST',
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
      },
      details: {
        animalType: 'DOG',
      },
    } as any,
    {
      publicId: 'far',
      type: 'LOST',
      location: {
        latitude: -35.6037,
        longitude: -59.3816,
      },
      details: {
        animalType: 'DOG',
      },
    } as any,
  ]);

  (component as any).userLatLng = {
    lat: -34.6037,
    lng: -58.3816,
  };

  component.cercaniaFiltro.set('5km');

  // When
  vi.spyOn(component as any, 'dibujarMarcadores')
    .mockImplementation(() => {});

  component.aplicarFiltros();

  // Then
  expect(component.reportesFiltrados()).toHaveLength(1);
  expect(component.reportesFiltrados()[0].publicId).toBe('near');
});

});

describe('clearSearch', () => {

  it('clears search term and suggestions', () => {

    // Given
    component.searchTerm.set('Buenos Aires');

    component.suggestions.set([
      {
        displayName: 'Buenos Aires',
        lat: -34.6,
        lng: -58.3,
      },
    ]);

    // When
    component.clearSearch();

    // Then
    expect(component.searchTerm()).toBe('');
    expect(component.suggestions()).toEqual([]);
  });

});

describe('selectSuggestion', () => {

  it('updates search term and clears suggestions', () => {

    // Given
    const suggestion = {
      displayName: 'La Plata',
      lat: -34.9,
      lng: -57.9,
    };

    component.suggestions.set([suggestion]);

    (component as any).map = {
      setView: vi.fn(),
    };

    vi.spyOn(component as any, 'markSearchResult')
      .mockImplementation(() => {});

    // When
    component.selectSuggestion(suggestion);

    // Then
    expect(component.searchTerm()).toBe('La Plata');
    expect(component.suggestions()).toEqual([]);
  });

});

describe('searchLocation', () => {

  it('selects the first existing suggestion', async () => {

    // Given
    const suggestion = {
      displayName: 'Buenos Aires',
      lat: -34.6037,
      lng: -58.3816,
    };

    component.suggestions.set([suggestion]);

    vi.spyOn(component, 'selectSuggestion')
      .mockImplementation(() => {});

    // When
    await component.searchLocation();

    // Then
    expect(component.selectSuggestion).toHaveBeenCalledWith(suggestion);
  });

  it('does nothing when there are no suggestions after fetching', async () => {

    // Given
    component.suggestions.set([]);

    vi.spyOn(component as any, 'fetchSuggestions')
      .mockResolvedValue(undefined);

    vi.spyOn(component, 'selectSuggestion')
      .mockImplementation(() => {});

    // When
    await component.searchLocation();

    // Then
    expect(component.selectSuggestion).not.toHaveBeenCalled();
  });

});

describe('closeSuccess', () => {

  it('clears success report id', () => {

    // Given
    component.successReportId.set('report-123');

    // When
    component.closeSuccess();

    // Then
    expect(component.successReportId()).toBeNull();
  });

  it('navigates removing query params', () => {

    // Given
    component.successReportId.set('report-123');

    // When
    component.closeSuccess();

    // Then
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      {
        queryParams: {},
        replaceUrl: true,
      },
    );
  });

});

describe('verReporte', () => {

  it('navigates to report detail', () => {

    // Given
    component.successReportId.set('report-123');

    // When
    component.verReporte();

    // Then
    expect(router.navigate).toHaveBeenCalledWith([
      '/reports',
      'report-123',
    ]);
  });

  it('clears success report id after navigation', () => {

    // Given
    component.successReportId.set('report-123');

    // When
    component.verReporte();

    // Then
    expect(component.successReportId()).toBeNull();
  });

});
describe('irALugar', () => {

  it('moves the map to the selected place', () => {

    // Given
    (component as any).map = {
      setView: vi.fn(),
    };

    // When
    component.irALugar(-34.6037, -58.3816);

    // Then
    expect((component as any).map.setView).toHaveBeenCalledWith(
      [-34.6037, -58.3816],
      18,
    );
  });

});

describe('formatBadge', () => {

  it('returns the number as text when it is less than or equal to ten', () => {

    // When
    const result = (component as any).formatBadge(10);

    // Then
    expect(result).toBe('10');
  });

  it('returns +10 when the number is greater than ten', () => {

    // When
    const result = (component as any).formatBadge(11);

    // Then
    expect(result).toBe('+10');
  });

});

describe('calcularDistancia', () => {

  it('returns zero when both points are the same', () => {

    // When
    const result = (component as any).calcularDistancia(
      -34.6037,
      -58.3816,
      -34.6037,
      -58.3816,
    );

    // Then
    expect(result).toBe(0);
  });

  it('returns a positive distance when points are different', () => {

    // When
    const result = (component as any).calcularDistancia(
      -34.6037,
      -58.3816,
      -34.6200,
      -58.4000,
    );

    // Then
    expect(result).toBeGreaterThan(0);
  });

});

describe('onSearchInput', () => {

  it('updates search term', () => {

    // When
    component.onSearchInput('Buenos Aires');

    // Then
    expect(component.searchTerm()).toBe('Buenos Aires');
  });

  it('clears suggestions when the search text has less than three characters', () => {

    // Given
    component.suggestions.set([
      {
        displayName: 'Buenos Aires',
        lat: -34.6037,
        lng: -58.3816,
      },
    ]);

    // When
    component.onSearchInput('Bo');

    // Then
    expect(component.suggestions()).toEqual([]);
  });

  it('fetches suggestions after debounce when the search text has at least three characters', () => {

    // Given
    vi.useFakeTimers();

    const fetchSuggestionsSpy = vi
      .spyOn(component as any, 'fetchSuggestions')
      .mockResolvedValue(undefined);

    // When
    component.onSearchInput('Buenos Aires');
    vi.advanceTimersByTime(350);

    // Then
    expect(fetchSuggestionsSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

});

describe('direccionCorta', () => {

  it('returns "Sin ubicación" when address is empty', () => {

    // When
    const result = (component as any).direccionCorta('');

    // Then
    expect(result).toBe('Sin ubicación');
  });

  it('returns street and number when address starts with a number', () => {

    // When
    const result = (component as any).direccionCorta('123, Avenida Corrientes, Buenos Aires');

    // Then
    expect(result).toBe('Avenida Corrientes 123');
  });

  it('returns the first address part when address does not start with a number', () => {

    // When
    const result = (component as any).direccionCorta('Avenida Corrientes 123, Buenos Aires');

    // Then
    expect(result).toBe('Avenida Corrientes 123');
  });

});

describe('fechaPopup', () => {

  it('formats a valid date', () => {

    // When
    const result = (component as any).fechaPopup('2026-06-01T10:00:00.000Z');

    // Then
    expect(result).toContain('2026');
  });

  it('returns "Sin fecha" when date is invalid', () => {

    // When
    const result = (component as any).fechaPopup('invalid-date');

    // Then
    expect(result).toBe('Sin fecha');
  });

});

describe('horaPopup', () => {

  it('formats a valid time', () => {

    // When
    const result = (component as any).horaPopup('2026-06-01T10:30:00.000Z');

    // Then
    expect(result).toContain('hs');
  });

  it('returns empty text when date is invalid', () => {

    // When
    const result = (component as any).horaPopup('invalid-date');

    // Then
    expect(result).toBe('');
  });

});

describe('nombrePopup', () => {

  it('returns the provided name when it exists', () => {

    // Given
    const reporte = {
      type: 'LOST',
      details: {
        animalType: 'DOG',
      },
    };

    // When
    const result = (component as any).nombrePopup(
      reporte,
      'Firulais',
    );

    // Then
    expect(result).toBe('Firulais');
  });

  it('returns "Perro perdido" for lost dog reports without name', () => {

    // Given
    const reporte = {
      type: 'LOST',
      details: {
        animalType: 'DOG',
      },
    };

    // When
    const result = (component as any).nombrePopup(
      reporte,
      undefined,
    );

    // Then
    expect(result).toBe('Perro perdido');
  });

  it('returns "Gato perdido" for lost cat reports without name', () => {

    // Given
    const reporte = {
      type: 'LOST',
      details: {
        animalType: 'CAT',
      },
    };

    // When
    const result = (component as any).nombrePopup(
      reporte,
      undefined,
    );

    // Then
    expect(result).toBe('Gato perdido');
  });

  it('returns "Perro avistado" for dog sightings', () => {

    // Given
    const reporte = {
      type: 'SIGHTING',
      details: {
        animalType: 'DOG',
        isInTransit: false,
      },
    };

    // When
    const result = (component as any).nombrePopup(
      reporte,
      undefined,
    );

    // Then
    expect(result).toBe('Perro avistado');
  });

  it('returns "Perro en tránsito" for dog sightings in transit', () => {

    // Given
    const reporte = {
      type: 'SIGHTING',
      details: {
        animalType: 'DOG',
        isInTransit: true,
      },
    };

    // When
    const result = (component as any).nombrePopup(
      reporte,
      undefined,
    );

    // Then
    expect(result).toBe('Perro en tránsito');
  });

});

describe('tiempoPopup', () => {

  it('returns "Hace instantes" for reports less than one hour old', () => {

    // Given
    const fecha = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // When
    const result = (component as any).tiempoPopup(fecha);

    // Then
    expect(result).toBe('Hace instantes');
  });

  it('returns hours for reports less than one day old', () => {

    // Given
    const fecha = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    // When
    const result = (component as any).tiempoPopup(fecha);

    // Then
    expect(result).toBe('Hace 3hs');
  });

  it('returns days for reports older than one day', () => {

    // Given
    const fecha = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // When
    const result = (component as any).tiempoPopup(fecha);

    // Then
    expect(result).toBe('Hace 2d');
  });

});

describe('fallbackIconFor', () => {

  it('returns the lost pet icon for lost reports', () => {

    // Given
    const reporte = {
      type: 'LOST',
      details: {
        animalType: 'DOG',
      },
    };

    // When
    const result = (component as any).fallbackIconFor(reporte);

    // Then
    expect(result).toBe('Icono-mascota-perdida.png');
  });

  it('returns the in-transit sighting icon for sightings in transit', () => {

    // Given
    const reporte = {
      type: 'SIGHTING',
      details: {
        animalType: 'DOG',
        isInTransit: true,
      },
    };

    // When
    const result = (component as any).fallbackIconFor(reporte);

    // Then
    expect(result).toBe('Icono-avistamiento-transito.png');
  });

  it('returns the non-transit sighting icon for sightings not in transit', () => {

    // Given
    const reporte = {
      type: 'SIGHTING',
      details: {
        animalType: 'DOG',
        isInTransit: false,
      },
    };

    // When
    const result = (component as any).fallbackIconFor(reporte);

    // Then
    expect(result).toBe('Icono-avistamiento-sin-transito.png');
  });

});

describe('buildPopup', () => {

  it('includes the report name in the popup html', () => {

    // Given
    const reporte = {
      publicId: 'rep-1',
      type: 'LOST',
      createdAt: '2026-06-01T10:00:00.000Z',
      occurredAt: '2026-06-01T10:00:00.000Z',
      location: {
        address: 'Avenida Corrientes 123, Buenos Aires',
      },
      details: {
        name: 'Firulais',
        animalType: 'DOG',
        images: [],
      },
    };

    // When
    const result = (component as any).buildPopup(reporte);

    // Then
    expect(result).toContain('Firulais');
  });

  it('includes the report detail link', () => {

    // Given
    const reporte = {
      publicId: 'rep-123',
      type: 'LOST',
      createdAt: '2026-06-01T10:00:00.000Z',
      occurredAt: '2026-06-01T10:00:00.000Z',
      location: {
        address: 'Avenida Corrientes 123',
      },
      details: {
        animalType: 'DOG',
        images: [],
      },
    };

    // When
    const result = (component as any).buildPopup(reporte);

    // Then
    expect(result).toContain('/reports/rep-123');
  });

  it('shows the lost pet badge text for lost reports', () => {

    // Given
    const reporte = {
      publicId: 'rep-1',
      type: 'LOST',
      createdAt: '2026-06-01T10:00:00.000Z',
      occurredAt: '2026-06-01T10:00:00.000Z',
      location: {
        address: 'Avenida Corrientes 123',
      },
      details: {
        animalType: 'DOG',
        images: [],
      },
    };

    // When
    const result = (component as any).buildPopup(reporte);

    // Then
    expect(result).toContain('Mascota perdida');
  });

  it('shows the sighting badge text for sighting reports', () => {

    // Given
    const reporte = {
      publicId: 'rep-1',
      type: 'SIGHTING',
      createdAt: '2026-06-01T10:00:00.000Z',
      occurredAt: '2026-06-01T10:00:00.000Z',
      location: {
        address: 'Avenida Corrientes 123',
      },
      details: {
        animalType: 'DOG',
        isInTransit: false,
        images: [],
      },
    };

    // When
    const result = (component as any).buildPopup(reporte);

    // Then
    expect(result).toContain('Mascota avistada');
  });

});

describe('ngOnInit', () => {

  it('sets success report id when report query param exists', async () => {

    // Given
    TestBed.inject(ActivatedRoute).snapshot.queryParamMap.get =
      vi.fn().mockReturnValue('report-123');

    profileService.getProfile.mockResolvedValue({
      photoUrl: 'https://image.com/profile.jpg',
    });

    // When
    await component.ngOnInit();

    // Then
    expect(component.successReportId()).toBe('report-123');
  });

  it('loads profile photo when profile has photo url', async () => {

    // Given
    profileService.getProfile.mockResolvedValue({
      photoUrl: 'https://image.com/profile.jpg',
    });

    // When
    await component.ngOnInit();

    // Then
    expect((component as any).profilePhotoUrl).toBe('https://image.com/profile.jpg');
  });

  it('keeps default profile photo when profile has no photo url', async () => {

    // Given
    profileService.getProfile.mockResolvedValue({
      photoUrl: '',
    });

    // When
    await component.ngOnInit();

    // Then
    expect((component as any).profilePhotoUrl).toContain('ui-avatars.com');
  });

  it('does not throw when profile loading fails', async () => {

  // Given
  profileService.getProfile.mockRejectedValue(new Error('Profile error'));

  // When
  const action = component.ngOnInit();

  // Then
  await expect(action).resolves.not.toThrow();
});

});


describe('cargarReportes', () => {

  it('loads reports and updates counters', async () => {

    // Given
    const reportes = [
      {
        publicId: 'r1',
        location: {
          latitude: -34.6,
          longitude: -58.3,
        },
        details: {},
      },
      {
        publicId: 'r2',
        location: {
          latitude: -34.7,
          longitude: -58.4,
        },
        details: {},
      },
    ];

    const misReportes = [
      { publicId: 'm1' },
      { publicId: 'm2' },
      { publicId: 'm3' },
      { publicId: 'm4' },
    ];

    reportListService.getGenerales.mockResolvedValue(reportes);
    reportListService.getMisReportes.mockResolvedValue(misReportes);

    vi.spyOn(component as any, 'dibujarMarcadores')
      .mockImplementation(() => {});

    // When
    await (component as any).cargarReportes();

    // Then
    expect(component.reportes()).toEqual(reportes);
    expect(component.reportesFiltrados()).toEqual(reportes);

    expect(component.totalMisReportes()).toBe(4);
    expect(component.misReportes()).toHaveLength(3);

    expect(component.totalCercanos()).toBe(2);
    expect(component.reportesCercanos()).toHaveLength(2);
  });

});

describe('cargarReportes error handling', () => {

  it('does not throw when report loading fails', async () => {

    // Given
    reportListService.getGenerales.mockRejectedValue(
      new Error('Backend error'),
    );

    // When
    const action = (component as any).cargarReportes();

    // Then
    await expect(action).resolves.toBeUndefined();
  });

});

describe('aplicarFiltroCentros', () => {

  it('searches veterinary places when veterinary filter is selected', async () => {

    // Given
    component.centrosFiltro.set('veterinarias');

    const buscarLugaresSpy = vi
      .spyOn(component as any, 'buscarLugares')
      .mockResolvedValue(undefined);

    // When
    await component.aplicarFiltroCentros();

    // Then
    expect(buscarLugaresSpy).toHaveBeenCalledWith('veterinary');
  });

  it('searches police places when police filter is selected', async () => {

    // Given
    component.centrosFiltro.set('comisarias');

    const buscarLugaresSpy = vi
      .spyOn(component as any, 'buscarLugares')
      .mockResolvedValue(undefined);

    // When
    await component.aplicarFiltroCentros();

    // Then
    expect(buscarLugaresSpy).toHaveBeenCalledWith('police');
  });

  it('clears places when all centers filter is selected', async () => {

    // Given
    component.centrosFiltro.set('todos');

    component.lugares.set([
      {
        nombre: 'Veterinaria',
        lat: -34.6,
        lng: -58.3,
      },
    ]);

    (component as any).lugaresLayer = {
      clearLayers: vi.fn(),
    };

    // When
    await component.aplicarFiltroCentros();

    // Then
    expect(component.lugares()).toEqual([]);
    expect((component as any).lugaresLayer.clearLayers).toHaveBeenCalled();
  });

});

describe('buscarLugares', () => {

  it('does nothing when user location does not exist', async () => {

    // Given
    (component as any).userLatLng = undefined;

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // When
    await (component as any).buscarLugares('veterinary');

    // Then
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('loads nearby veterinary places', async () => {

    // Given
    (component as any).userLatLng = {
      lat: -34.6037,
      lng: -58.3816,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        elements: [
          {
            tags: {
              name: 'Veterinaria Central',
            },
            lat: -34.604,
            lon: -58.382,
          },
        ],
      }),
    } as any);

    vi.spyOn(component as any, 'dibujarLugares')
      .mockImplementation(() => {});

    // When
    await (component as any).buscarLugares('veterinary');

    // Then
    expect(component.lugares()).toEqual([
      {
        nombre: 'Veterinaria Central',
        lat: -34.604,
        lng: -58.382,
      },
    ]);
  });

  it('uses default police name when place has no name', async () => {

    // Given
    (component as any).userLatLng = {
      lat: -34.6037,
      lng: -58.3816,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        elements: [
          {
            tags: {},
            lat: -34.604,
            lon: -58.382,
          },
        ],
      }),
    } as any);

    vi.spyOn(component as any, 'dibujarLugares')
      .mockImplementation(() => {});

    // When
    await (component as any).buscarLugares('police');

    // Then
    expect(component.lugares()[0].nombre).toBe('Comisaría');
  });

  it('uses default veterinary name when place has no name', async () => {

    // Given
    (component as any).userLatLng = {
      lat: -34.6037,
      lng: -58.3816,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        elements: [
          {
            tags: {},
            lat: -34.604,
            lon: -58.382,
          },
        ],
      }),
    } as any);

    vi.spyOn(component as any, 'dibujarLugares')
      .mockImplementation(() => {});

    // When
    await (component as any).buscarLugares('veterinary');

    // Then
    expect(component.lugares()[0].nombre).toBe('Veterinaria');
  });

  it('does not throw when nearby places request fails', async () => {

    // Given
    (component as any).userLatLng = {
      lat: -34.6037,
      lng: -58.3816,
    };

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new Error('Network error'),
    );

    // When
    const action = (component as any).buscarLugares('veterinary');

    // Then
    await expect(action).resolves.toBeUndefined();
  });

});

describe('centerOnUser', () => {

  it('centers the map when user location exists', () => {

    // Given
    const userLatLng = {
      lat: -34.6037,
      lng: -58.3816,
    };

    (component as any).userLatLng = userLatLng;

    (component as any).map = {
      setView: vi.fn(),
    };

    // When
    (component as any).centerOnUser();

    // Then
    expect((component as any).map.setView).toHaveBeenCalledWith(
      userLatLng,
      16,
    );
  });

  it('tries to get user location when user location does not exist', () => {

    // Given
    (component as any).userLatLng = undefined;

    const getUserLocationSpy = vi
      .spyOn(component as any, 'getUserLocation')
      .mockImplementation(() => {});

    // When
    (component as any).centerOnUser();

    // Then
    expect(getUserLocationSpy).toHaveBeenCalled();
  });

});

describe('placeUserMarker', () => {

  it('does nothing when user location does not exist', () => {

    // Given
    (component as any).userLatLng = undefined;

    // When
    (component as any).placeUserMarker();

    // Then
    expect((component as any).userMarker).toBeUndefined();
  });

  it('updates existing user marker position', () => {

    // Given
    const userLatLng = {
      lat: -34.6037,
      lng: -58.3816,
    };

    const userMarker = {
      setLatLng: vi.fn(),
    };

    (component as any).userLatLng = userLatLng;
    (component as any).userMarker = userMarker;

    // When
    (component as any).placeUserMarker();

    // Then
    expect(userMarker.setLatLng).toHaveBeenCalledWith(userLatLng);
  });

});

describe('markSearchResult', () => {

  it('updates existing search marker position', () => {

    // Given
    const searchMarker = {
      setLatLng: vi.fn(),
    };

    (component as any).searchMarker = searchMarker;

    // When
    (component as any).markSearchResult(-34.6037, -58.3816);

    // Then
    expect(searchMarker.setLatLng).toHaveBeenCalled();
  });

});

describe('clearSearch with marker', () => {

  it('removes search marker when it exists', () => {

    // Given
    const searchMarker = {
      remove: vi.fn(),
    };

    (component as any).searchMarker = searchMarker;
    component.searchTerm.set('Buenos Aires');

    // When
    component.clearSearch();

    // Then
    expect(searchMarker.remove).toHaveBeenCalled();
    expect((component as any).searchMarker).toBeUndefined();
  });

});

describe('buildPin', () => {

  it('creates a pin with image when image url exists', () => {

    // When
    const result = (component as any).buildPin(
      '#E8842E',
      'https://image.com/dog.jpg',
    );

    // Then
    expect(result.options.html).toContain('dog.jpg');
  });

  it('creates a pin with fallback icon when image does not exist', () => {

    // When
    const result = (component as any).buildPin(
      '#E8842E',
      undefined,
      'Icono-mascota-perdida.png',
    );

    // Then
    expect(result.options.html).toContain(
      'Icono-mascota-perdida.png',
    );
  });

  it('creates a pin without image content when no image or fallback exists', () => {

    // When
    const result = (component as any).buildPin(
      '#E8842E',
    );

    // Then
    expect(result.options.html).not.toContain('<img');
  });

});

describe('dibujarLugares', () => {

  it('clears previous places layer', () => {

    // Given
    (component as any).lugaresLayer = {
      clearLayers: vi.fn(),
    };

    component.lugares.set([]);

    // When
    (component as any).dibujarLugares();

    // Then
    expect(
      (component as any).lugaresLayer.clearLayers,
    ).toHaveBeenCalled();
  });

});

describe('getUserLocation', () => {

  it('sets user location and centers the map when geolocation succeeds', () => {

    // Given
    vi.useFakeTimers();

    const placeUserMarkerSpy = vi
      .spyOn(component as any, 'placeUserMarker')
      .mockImplementation(() => {});

    (component as any).map = {
      setView: vi.fn(),
      invalidateSize: vi.fn(),
    };

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

    // When
    (component as any).getUserLocation();

    vi.advanceTimersByTime(100);

    // Then
    expect((component as any).userLatLng.lat).toBe(-34.6037);
    expect((component as any).userLatLng.lng).toBe(-58.3816);

    expect(placeUserMarkerSpy).toHaveBeenCalled();

    expect((component as any).map.setView).toHaveBeenCalledWith(
      (component as any).userLatLng,
      15,
    );

    expect((component as any).map.invalidateSize).toHaveBeenCalled();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('centers the map on default location when geolocation fails', () => {

    // Given
    vi.useFakeTimers();

    (component as any).map = {
      setView: vi.fn(),
      invalidateSize: vi.fn(),
    };

    const getCurrentPosition = vi.fn().mockImplementation((_success, error) => {
      error();
    });

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition,
      },
    });

    // When
    (component as any).getUserLocation();

    vi.advanceTimersByTime(100);

    // Then
    expect((component as any).map.setView).toHaveBeenCalledWith(
      [-34.603734, -58.38157],
      13,
    );

    expect((component as any).map.invalidateSize).toHaveBeenCalled();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

});

describe('fetchSuggestions', () => {

  it('clears suggestions when request fails', async () => {

    // Given
    component.searchTerm.set('Buenos Aires');

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new Error('Network error'),
    );

    // When
    await (component as any).fetchSuggestions();

    // Then
    expect(component.suggestions()).toEqual([]);
  });

});

describe('fetchSuggestions without query', () => {

  it('does nothing when search term is empty', async () => {

    // Given
    component.searchTerm.set('');

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockClear();

    // When
    await (component as any).fetchSuggestions();

    // Then
    expect(fetchSpy).not.toHaveBeenCalled();
  });

});

describe('fetchSuggestions', () => {

  it('loads and maps location suggestions', async () => {

    // Given
    component.searchTerm.set('Buenos Aires');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: vi.fn().mockResolvedValue([
        {
          display_name: 'Buenos Aires, Argentina',
          lat: '-34.6037',
          lon: '-58.3816',
        },
      ]),
    } as any);

    // When
    await (component as any).fetchSuggestions();

    // Then
    expect(component.suggestions()).toEqual([
      {
        displayName: 'Buenos Aires, Argentina',
        lat: -34.6037,
        lng: -58.3816,
      },
    ]);
  });

});

describe('formatBadge edge cases', () => {

  it('returns zero as text', () => {

    // When
    const result = (component as any).formatBadge(0);

    // Then
    expect(result).toBe('0');
  });

});

describe('tiempoPopup edge cases', () => {

  it('returns one hour text', () => {

    // Given
    const fecha = new Date(
      Date.now() - 60 * 60 * 1000,
    ).toISOString();

    // When
    const result = (component as any).tiempoPopup(fecha);

    // Then
    expect(result).toContain('1');
  });

});

describe('direccionCorta edge cases', () => {

  it('returns address when it has no commas', () => {

    // When
    const result = (component as any).direccionCorta(
      'Avenida Corrientes 123',
    );

    // Then
    expect(result).toBe('Avenida Corrientes 123');
  });

});

describe('searchLocation edge cases', () => {

  it('fetches suggestions when there are none loaded', async () => {

    // Given
    component.suggestions.set([]);

    const fetchSuggestionsSpy = vi
      .spyOn(component as any, 'fetchSuggestions')
      .mockResolvedValue(undefined);

    // When
    await component.searchLocation();

    // Then
    expect(fetchSuggestionsSpy).toHaveBeenCalled();
  });

});
















});