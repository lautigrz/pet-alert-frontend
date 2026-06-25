import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
} from '@angular/router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ReportListPage } from './report-list';
import { ReportListService } from '../../application/report-list.service';
import { Reporte } from '../../domain/report-read.model';

type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

function mockTimeouts(): {
  callbacks: Map<TimeoutHandle, () => void>;
  clearTimeoutSpy: ReturnType<typeof vi.spyOn>;
} {
  const callbacks = new Map<TimeoutHandle, () => void>();
  let nextId = 1;

  vi.spyOn(globalThis, 'setTimeout').mockImplementation(
    ((
      handler: (...args: unknown[]) => void,
      _delay?: number,
      ...args: unknown[]
    ): TimeoutHandle => {
      const id = nextId++ as unknown as TimeoutHandle;

      callbacks.set(id, () => {
        handler(...args);
      });

      return id;
    }) as unknown as typeof globalThis.setTimeout,
  );

  const clearTimeoutSpy = vi
    .spyOn(globalThis, 'clearTimeout')
    .mockImplementation(
      ((id?: TimeoutHandle): void => {
        if (id !== undefined) {
          callbacks.delete(id);
        }
      }) as unknown as typeof globalThis.clearTimeout,
    );

  return {
    callbacks,
    clearTimeoutSpy,
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const reporteFacundo: Reporte = {
  publicId: 'report-facundo-1',
  user: {
    publicId: 'user-facundo',
  },
  type: 'SIGHTING',
  status: 'ACTIVE',
  description: 'Perro marrón con una mancha blanca en el pecho',
  location: {
    address: 'El Palomar, Buenos Aires',
    latitude: -34.61,
    longitude: -58.59,
  },
  details: {
    petName: '',
    animalType: 'DOG',
    hasIdCollar: true,
    isInTransit: false,
    color: 'Marrón',
    images: [],
  },
  occurredAt: '2026-06-12T12:00:00.000Z',
  createdAt: '2026-06-12T13:00:00.000Z',
};

const reporteGato: Reporte = {
  publicId: 'report-facundo-2',
  user: {
    publicId: 'user-facundo',
  },
  type: 'LOST',
  status: 'ACTIVE',
  description: 'Gata gris con collar rojo',
  location: {
    address: 'Morón, Buenos Aires',
    latitude: -34.65,
    longitude: -58.62,
  },
  details: {
    publicId: 'pet-1',
    name: 'Luna',
    animalType: 'CAT',
    genderType: 'FEMALE',
    sizeType: 'SMALL',
    color: 'Gris',
    hasIdCollar: true,
    breed: 'Mestiza',
    images: [],
  },
  occurredAt: '2026-06-11T12:00:00.000Z',
  createdAt: '2026-06-11T13:00:00.000Z',
};

describe('ReportListPage', () => {
  let reportListService: {
    getGenerales: ReturnType<typeof vi.fn>;
    getMisReportes: ReturnType<typeof vi.fn>;
  };

  let fixture: ComponentFixture<ReportListPage>;
  let component: ReportListPage;

  beforeEach(() => {
    reportListService = {
      getGenerales: vi.fn(),
      getMisReportes: vi.fn(),
    };

    reportListService.getGenerales.mockResolvedValue([
      reporteFacundo,
      reporteGato,
    ]);

    reportListService.getMisReportes.mockResolvedValue([
      reporteFacundo,
    ]);

    TestBed.configureTestingModule({
      imports: [ReportListPage],
      providers: [
        {
          provide: ReportListService,
          useValue: reportListService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ReportListPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  describe('initial loading', () => {
    it('loads active general reports on init', async () => {
      // When
      await component.ngOnInit();

      // Then
      expect(reportListService.getGenerales).toHaveBeenCalledWith({
        status: 'ACTIVE',
      });

      expect(component.reportes()).toEqual([
        reporteFacundo,
        reporteGato,
      ]);

      expect(component.cargando()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('shows an error when reports cannot be loaded', async () => {
      // Given
      reportListService.getGenerales.mockRejectedValue(
        new Error('No se pudieron cargar los reportes'),
      );

      // When
      await component.ngOnInit();

      // Then
      expect(component.error()).toBe(
        'No se pudieron cargar los reportes',
      );

      expect(component.reportes()).toEqual([]);
      expect(component.cargando()).toBe(false);
    });
  });

  describe('description search', () => {
    it('sends q to the backend after the debounce', async () => {
      // Given
      const { callbacks } = mockTimeouts();

      reportListService.getGenerales.mockResolvedValue([
        reporteFacundo,
      ]);

      // When
      component.onDescriptionSearchInput('perrro marron');

      const callback = [...callbacks.values()][0];

      expect(callback).toBeDefined();

      callback!();
      await flushPromises();

      // Then
      expect(component.busquedaDescripcion()).toBe(
        'perrro marron',
      );

      expect(reportListService.getGenerales).toHaveBeenCalledWith({
        q: 'perrro marron',
        status: 'ACTIVE',
      });

      expect(component.reportes()).toEqual([
        reporteFacundo,
      ]);
    });

    it('does not send q when the text has fewer than 2 characters', async () => {
      // Given
      const { callbacks } = mockTimeouts();

      // When
      component.onDescriptionSearchInput('p');

      const callback = [...callbacks.values()][0];

      expect(callback).toBeDefined();

      callback!();
      await flushPromises();

      // Then
      expect(reportListService.getGenerales).toHaveBeenCalledWith({
        status: 'ACTIVE',
      });

      expect(reportListService.getGenerales).not.toHaveBeenCalledWith({
        q: 'p',
        status: 'ACTIVE',
      });
    });

    it('trims the description query before sending it', async () => {
      // Given
      const { callbacks } = mockTimeouts();

      // When
      component.onDescriptionSearchInput(
        '  mancha blanca  ',
      );

      const callback = [...callbacks.values()][0];

      expect(callback).toBeDefined();

      callback!();
      await flushPromises();

      // Then
      expect(reportListService.getGenerales).toHaveBeenCalledWith({
        q: 'mancha blanca',
        status: 'ACTIVE',
      });
    });

    it('cancels the previous debounce when the user keeps typing', async () => {
      // Given
      const {
        callbacks,
        clearTimeoutSpy,
      } = mockTimeouts();

      reportListService.getGenerales.mockClear();

      // When
      component.onDescriptionSearchInput('per');

      expect(callbacks.size).toBe(1);

      component.onDescriptionSearchInput('perrro');

      // Then: se canceló el timeout anterior
      expect(clearTimeoutSpy).toHaveBeenCalledOnce();

      // Solo queda pendiente la última búsqueda
      expect(callbacks.size).toBe(1);

      const remainingCallback = [...callbacks.values()][0];

      expect(remainingCallback).toBeDefined();

      remainingCallback!();
      await flushPromises();

      expect(reportListService.getGenerales).toHaveBeenCalledTimes(1);

      expect(reportListService.getGenerales).toHaveBeenCalledWith({
        q: 'perrro',
        status: 'ACTIVE',
      });
    });

    it('clears the description search and reloads without q', async () => {
      // Given
      component.busquedaDescripcion.set('perro marrón');

      // When
      await component.limpiarBusquedaDescripcion();

      // Then
      expect(component.busquedaDescripcion()).toBe('');

      expect(reportListService.getGenerales).toHaveBeenCalledWith({
        status: 'ACTIVE',
      });
    });

    it('combines q with the selected filters', async () => {
      // Given
      component.busquedaDescripcion.set('collar rojo');

      // When
      await component.setFiltroTipo('LOST');
      await component.setFiltroMascota('CAT');

      // Then
      expect(reportListService.getGenerales).toHaveBeenLastCalledWith({
        reportType: 'LOST',
        animalType: 'CAT',
        q: 'collar rojo',
        status: 'ACTIVE',
      });
    });
  });

  describe('search in my reports', () => {
    it('sends q when the user selects My Reports', async () => {
      // Given
      component.busquedaDescripcion.set('mancha blanca');

      // When
      await component.seleccionarTab('mis-reportes');

      // Then
      expect(reportListService.getMisReportes).toHaveBeenCalledWith({
        q: 'mancha blanca',
      });

      expect(reportListService.getGenerales).not.toHaveBeenCalled();

      expect(component.reportes()).toEqual([
        reporteFacundo,
      ]);
    });

    it('shows only active reports, hiding resolved and closed ones', async () => {
      // Given
      reportListService.getMisReportes.mockResolvedValue([
        reporteFacundo,
        { ...reporteFacundo, publicId: 'mio-resuelto', status: 'RESOLVED' },
        { ...reporteFacundo, publicId: 'mio-cerrado', status: 'CLOSED' },
      ]);

      // When
      await component.seleccionarTab('mis-reportes');

      // Then
      expect(component.reportes()).toEqual([
        reporteFacundo,
      ]);
    });
  });

});

