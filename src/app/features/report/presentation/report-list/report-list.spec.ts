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
    getGenerals: ReturnType<typeof vi.fn>;
    getPaginatedMyReports: ReturnType<typeof vi.fn>;
  };

  let fixture: ComponentFixture<ReportListPage>;
  let component: ReportListPage;

  beforeEach(() => {
    reportListService = {
      getGenerals: vi.fn(),
      getPaginatedMyReports: vi.fn(),
    };

    reportListService.getGenerals.mockResolvedValue([
      reporteFacundo,
      reporteGato,
    ]);

    reportListService.getPaginatedMyReports.mockResolvedValue({
      data: [reporteFacundo],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

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
      await component.ngOnInit();

      expect(reportListService.getGenerals).toHaveBeenCalledWith({
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
      reportListService.getGenerals.mockRejectedValue(
        new Error('No se pudieron cargar los reportes'),
      );

      await component.ngOnInit();

      expect(component.error()).toBe(
        'No se pudieron cargar los reportes',
      );

      expect(component.reportes()).toEqual([]);
      expect(component.cargando()).toBe(false);
    });
  });

  describe('description search', () => {
    it('sends q to the backend after the debounce', async () => {
      const { callbacks } = mockTimeouts();

      reportListService.getGenerals.mockResolvedValue([
        reporteFacundo,
      ]);

      component.onDescriptionSearchInput('perrro marron');

      const callback = [...callbacks.values()][0];

      expect(callback).toBeDefined();

      callback!();
      await flushPromises();

      expect(component.busquedaDescripcion()).toBe(
        'perrro marron',
      );

      expect(reportListService.getGenerals).toHaveBeenCalledWith({
        q: 'perrro marron',
        status: 'ACTIVE',
      });

      expect(component.reportes()).toEqual([
        reporteFacundo,
      ]);
    });

    it('does not send q when the text has fewer than 2 characters', async () => {
      const { callbacks } = mockTimeouts();

      component.onDescriptionSearchInput('p');

      const callback = [...callbacks.values()][0];

      expect(callback).toBeDefined();

      callback!();
      await flushPromises();

      expect(reportListService.getGenerals).toHaveBeenCalledWith({
        status: 'ACTIVE',
      });

      expect(reportListService.getGenerals).not.toHaveBeenCalledWith({
        q: 'p',
        status: 'ACTIVE',
      });
    });

    it('trims the description query before sending it', async () => {
      const { callbacks } = mockTimeouts();

      component.onDescriptionSearchInput(
        '  mancha blanca  ',
      );

      const callback = [...callbacks.values()][0];

      expect(callback).toBeDefined();

      callback!();
      await flushPromises();

      expect(reportListService.getGenerals).toHaveBeenCalledWith({
        q: 'mancha blanca',
        status: 'ACTIVE',
      });
    });

    it('cancels the previous debounce when the user keeps typing', async () => {
      const {
        callbacks,
        clearTimeoutSpy,
      } = mockTimeouts();

      reportListService.getGenerals.mockClear();

      component.onDescriptionSearchInput('per');

      expect(callbacks.size).toBe(1);

      component.onDescriptionSearchInput('perrro');

      expect(clearTimeoutSpy).toHaveBeenCalledOnce();
      expect(callbacks.size).toBe(1);

      const remainingCallback = [...callbacks.values()][0];

      expect(remainingCallback).toBeDefined();

      remainingCallback!();
      await flushPromises();

      expect(reportListService.getGenerals).toHaveBeenCalledTimes(1);

      expect(reportListService.getGenerals).toHaveBeenCalledWith({
        q: 'perrro',
        status: 'ACTIVE',
      });
    });

    it('clears the description search and reloads without q', async () => {
      component.busquedaDescripcion.set('perro marrón');

      await component.limpiarBusquedaDescripcion();

      expect(component.busquedaDescripcion()).toBe('');

      expect(reportListService.getGenerals).toHaveBeenCalledWith({
        status: 'ACTIVE',
      });
    });

    it('combines q with the selected filters', async () => {
      component.busquedaDescripcion.set('collar rojo');

      await component.setFiltroTipo('LOST');
      await component.setFiltroMascota('CAT');

      expect(reportListService.getGenerals).toHaveBeenLastCalledWith({
        reportType: 'LOST',
        animalType: 'CAT',
        q: 'collar rojo',
        status: 'ACTIVE',
      });
    });
  });

  describe('search in my reports', () => {
    it('sends q when the user selects My Reports', async () => {
      component.busquedaDescripcion.set('mancha blanca');

      await component.selectTab('mis-reportes');

      expect(reportListService.getPaginatedMyReports).toHaveBeenCalledWith(
        { q: 'mancha blanca' },
        1,
        10,
      );

      expect(reportListService.getGenerals).not.toHaveBeenCalled();

      expect(component.reportes()).toEqual([
        reporteFacundo,
      ]);
    });

    it('shows all the user reports including resolved and closed ones', async () => {
      const resuelto: Reporte = {
        ...reporteFacundo,
        publicId: 'mio-resuelto',
        status: 'RESOLVED',
      };

      const cerrado: Reporte = {
        ...reporteFacundo,
        publicId: 'mio-cerrado',
        status: 'CLOSED',
      };

      reportListService.getPaginatedMyReports.mockResolvedValue({
        data: [reporteFacundo, resuelto, cerrado],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
        },
      });

      await component.selectTab('mis-reportes');

      expect(component.reportes()).toEqual([
        reporteFacundo,
        resuelto,
        cerrado,
      ]);
    });
  });

  describe('pagination in my reports', () => {
    beforeEach(() => {
      reportListService.getPaginatedMyReports.mockResolvedValue({
        data: [reporteFacundo],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('keeps the applied filters when changing page', async () => {
      component.busquedaDescripcion.set('mancha');

      await component.selectTab('mis-reportes');
      await component.goToPage(2);

      expect(reportListService.getPaginatedMyReports).toHaveBeenLastCalledWith(
        { q: 'mancha' },
        2,
        10,
      );

      expect(component.page()).toBe(2);
    });

    it('goes back to page 1 when a filter changes', async () => {
      await component.selectTab('mis-reportes');

      await component.goToPage(3);

      expect(component.page()).toBe(3);

      await component.setFiltroTipo('LOST');

      expect(component.page()).toBe(1);
    });
  });

  describe('general reports pagination', () => {
    it('paginates the general reports on the client and caches the page', async () => {
      const muchos: Reporte[] = Array.from({ length: 25 }, (_, i) => ({
        ...reporteFacundo,
        publicId: `g-${i}`,
      }));

      reportListService.getGenerals.mockResolvedValue(muchos);

      await component.ngOnInit();

      expect(component.totalPages()).toBe(3);
      expect(component.reportes().length).toBe(10);
      expect(component.reportes()[0].publicId).toBe('g-0');

      await component.goToPage(2);

      expect(component.reportes()[0].publicId).toBe('g-10');
      expect(reportListService.getGenerals).toHaveBeenCalledTimes(1);
    });
  });
});
