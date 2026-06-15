import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { authInterceptor } from './auth.interceptor';
import { TokenStorage } from '../../features/auth/infrastructure/token.storage';
import { AuthService } from '../../features/auth/application/auth.service';

// Vacia la cola de microtasks para que el refresh (Promise) y su retry se resuelvan
const flushAsync = () => new Promise((resolve) => setTimeout(resolve));

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: { read: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let authService: { refreshSession: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    tokenStorage = { read: vi.fn(), clear: vi.fn(), save: vi.fn() };
    authService = { refreshSession: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenStorage, useValue: tokenStorage },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('when there is a stored access token', () => {
    it('attaches it as a Bearer header on protected requests', () => {
      // Given un access token guardado
      tokenStorage.read.mockReturnValue({ accessToken: 'abc', refreshToken: 'r' });

      // When pego a un endpoint protegido
      http.get('/api/pets').subscribe();

      // Then el request lleva el Authorization
      const req = httpMock.expectOne('/api/pets');
      expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
      req.flush({});
    });
  });

  describe('when the request is a public auth endpoint', () => {
    it('does NOT trigger a refresh on a 401 (e.g. wrong credentials on login)', () => {
      // Given storage vacio (login todavia no autenticado)
      tokenStorage.read.mockReturnValue(null);
      let status = 0;

      // When el login responde 401
      http.post('/api/auth/login', {}).subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne('/api/auth/login')
        .flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      // Then el 401 se propaga tal cual y no se intenta refrescar
      expect(authService.refreshSession).not.toHaveBeenCalled();
      expect(status).toBe(401);
    });
  });

  describe('when a protected request returns 401', () => {
    it('refreshes the token and retries the original request', async () => {
      // Given un access viejo guardado y un refresh que devuelve uno nuevo
      tokenStorage.read.mockReturnValue({ accessToken: 'old', refreshToken: 'r' });
      authService.refreshSession.mockResolvedValue('new-access');
      let body: unknown;

      // When el primer intento devuelve 401
      http.get('/api/pets').subscribe((b) => (body = b));
      const first = httpMock.expectOne('/api/pets');
      expect(first.request.headers.get('Authorization')).toBe('Bearer old');
      first.flush(null, { status: 401, statusText: 'Unauthorized' });
      await flushAsync();

      // Then se reintenta con el token nuevo y resuelve OK
      const retry = httpMock.expectOne('/api/pets');
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
      retry.flush({ ok: true });
      expect(authService.refreshSession).toHaveBeenCalledTimes(1);
      expect(body).toEqual({ ok: true });
    });

    it('clears the session and redirects to login when the refresh fails', async () => {
      // Given un refresh que falla (sesion irrecuperable)
      tokenStorage.read.mockReturnValue({ accessToken: 'old', refreshToken: 'r' });
      authService.refreshSession.mockRejectedValue(new Error('expired'));
      let errored = false;

      // When el request devuelve 401 y el refresh no se puede hacer
      http.get('/api/pets').subscribe({ error: () => (errored = true) });
      httpMock.expectOne('/api/pets').flush(null, { status: 401, statusText: 'Unauthorized' });
      await flushAsync();

      // Then limpia tokens, manda a /login y propaga el error
      expect(tokenStorage.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(errored).toBe(true);
    });
  });
});
