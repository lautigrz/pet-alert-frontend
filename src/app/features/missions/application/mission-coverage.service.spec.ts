import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi, afterEach } from 'vitest';
import { MissionCoverageService } from './mission-coverage.service';
import { MissionCoverageHttp } from '../infrastructure/mission-coverage.http';
import { AuthService } from '../../auth/application/auth.service';
import * as ngeohash from 'ngeohash';

describe('MissionCoverageService', () => {
  let service: MissionCoverageService;
  let mockCoverageHttp: {
    postCoverage: ReturnType<typeof vi.fn>;
    getCoverage: ReturnType<typeof vi.fn>;
  };

  const mockGeolocation = {
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  };

  const mockAuthService = {
    getCurrentUserId: () => 'user1'
  };

  beforeEach(() => {
    mockCoverageHttp = {
      postCoverage: vi.fn(),
      getCoverage: vi.fn()
    };

    // Mock geolocation
    vi.stubGlobal('navigator', {
      geolocation: mockGeolocation
    });

    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { for (const k in store) delete store[k]; }
    });

    TestBed.configureTestingModule({
      providers: [
        MissionCoverageService,
        { provide: MissionCoverageHttp, useValue: mockCoverageHttp },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    service = TestBed.inject(MissionCoverageService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.stopTracking();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('debería crear el servicio', () => {
    expect(service).toBeTruthy();
  });

  describe('startTracking', () => {
    it('debería inicializar el tracking cargando los datos desde localStorage', () => {
      localStorage.setItem('pet_alert_visited_user1_m1', JSON.stringify(['dr5ru718']));
      localStorage.setItem('pet_alert_buffer_user1_m1', JSON.stringify(['dr5ru718']));
      localStorage.setItem('pet_alert_last_sync_user1_m1', '2026-07-11T00:00:00Z');

      mockCoverageHttp.getCoverage.mockReturnValue(of({ cells: [], lastSyncTimestamp: '2026-07-11T01:00:00Z' }));

      service.startTracking('m1', undefined, undefined, undefined, true);

      expect(service.getVisitedCount()).toBe(1);
      expect(service.getAllCellsCount()).toBe(1);
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      expect(mockCoverageHttp.getCoverage).toHaveBeenCalledWith('m1', '');
    });

    it('debería suscribirse a la geolocalización y procesar nuevas posiciones', () => {
      mockCoverageHttp.getCoverage.mockReturnValue(of({ cells: [], lastSyncTimestamp: '' }));
      service.startTracking('m1', undefined, undefined, undefined, true);

      // Obtener el callback de watchPosition
      const successCallback = mockGeolocation.watchPosition.mock.calls[0][0];

      // Simular nueva posición
      const coords = { latitude: -34.6037, longitude: -58.3816, accuracy: 10 };
      successCallback({ coords } as GeolocationPosition);

      expect(service.getVisitedCount()).toBe(1);
      const points = service.coveragePoints();
      expect(points.length).toBe(1);
      // Decodificar el geohash para verificar que se agregó
      const cell = ngeohash.encode(-34.6037, -58.3816, 8);
      const decoded = ngeohash.decode(cell);
      expect(points[0][0]).toBeCloseTo(decoded.latitude, 4);
      expect(points[0][1]).toBeCloseTo(decoded.longitude, 4);
    });
  });

  describe('syncPendingBuffer', () => {
    it('debería sincronizar las celdas en batch cada 15 segundos y limpiar el buffer en éxito', () => {
      mockCoverageHttp.getCoverage.mockReturnValue(of({ cells: [], lastSyncTimestamp: '' }));
      mockCoverageHttp.postCoverage.mockReturnValue(of(undefined));

      service.startTracking('m1', undefined, undefined, undefined, true);

      // Agregar celdas simulando posición
      const successCallback = mockGeolocation.watchPosition.mock.calls[0][0];
      successCallback({ coords: { latitude: -34.6037, longitude: -58.3816 } } as GeolocationPosition);

      // Avanzar el tiempo 15 segundos
      vi.advanceTimersByTime(15000);

      expect(mockCoverageHttp.postCoverage).toHaveBeenCalled();
      // El buffer local en localStorage debería estar vacío
      const buffer = JSON.parse(localStorage.getItem('pet_alert_buffer_user1_m1') || '[]');
      expect(buffer.length).toBe(0);
    });

    it('debería mantener las celdas en el buffer si el post falla para reintentar después', () => {
      mockCoverageHttp.getCoverage.mockReturnValue(of({ cells: [], lastSyncTimestamp: '' }));
      mockCoverageHttp.postCoverage.mockReturnValue(throwError(() => new Error('Network error')));

      service.startTracking('m1', undefined, undefined, undefined, true);

      const successCallback = mockGeolocation.watchPosition.mock.calls[0][0];
      successCallback({ coords: { latitude: -34.6037, longitude: -58.3816 } } as GeolocationPosition);

      vi.advanceTimersByTime(15000);

      expect(mockCoverageHttp.postCoverage).toHaveBeenCalled();
      const buffer = JSON.parse(localStorage.getItem('pet_alert_buffer_user1_m1') || '[]');
      expect(buffer.length).toBe(1); // Mantiene el punto para reintentar
    });
  });

  describe('polling', () => {
    it('debería hacer polling cada 17 segundos y actualizar el heatmap con nuevos puntos', () => {
      mockCoverageHttp.getCoverage.mockReturnValueOnce(of({ cells: [], lastSyncTimestamp: 'ts1' }));
      service.startTracking('m1');

      expect(mockCoverageHttp.getCoverage).toHaveBeenCalledWith('m1', '');

      // Mockear respuesta del polling
      mockCoverageHttp.getCoverage.mockReturnValueOnce(of({ cells: ['dr5ru718'], lastSyncTimestamp: 'ts2' }));

      // Avanzar 17 segundos
      vi.advanceTimersByTime(17000);

      expect(mockCoverageHttp.getCoverage).toHaveBeenLastCalledWith('m1', 'ts1');
      expect(service.getAllCellsCount()).toBe(1);
    });
  });
});
