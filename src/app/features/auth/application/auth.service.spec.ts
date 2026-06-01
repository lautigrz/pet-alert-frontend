import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { AuthHttp } from '../infrastructure/auth.http';
import { TokenStorage } from '../infrastructure/token.storage';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidLoginDataError,
  InvalidRegistrationDataError,
  NetworkError,
  RateLimitedError,
  SessionExpiredError,
  UnexpectedAuthError,
} from '../domain/auth.errors';

describe('AuthService.register', () => {
  let authHttp: { registerUser: ReturnType<typeof vi.fn>; loginUser: ReturnType<typeof vi.fn> };
  let tokenStorage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { registerUser: vi.fn(), loginUser: vi.fn() };
    tokenStorage = { save: vi.fn(), clear: vi.fn(), read: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: tokenStorage },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when the back creates the user', () => {
    it('returns the registered user id and sends username to the back', async () => {
      // Given un AuthHttp que devuelve el id creado
      authHttp.registerUser.mockResolvedValue({ id: 'uuid-abc' });

      // When llamo a register
      const result = await service.register({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
      });

      // Then se devuelve el id y se enviaron los 3 campos al back
      expect(result).toEqual({ id: 'uuid-abc' });
      expect(authHttp.registerUser).toHaveBeenCalledWith({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
      });
    });

    it('normalizes the email and trims the username before sending', async () => {
      // Given un AuthHttp que acepta cualquier request
      authHttp.registerUser.mockResolvedValue({ id: 'uuid-abc' });

      // When llamo a register con email sucio y username con espacios
      await service.register({
        email: '  JUAN@Example.com  ',
        username: '  juancho  ',
        password: 'miPass123',
      });

      // Then el back recibe el email normalizado y el username sin espacios
      expect(authHttp.registerUser).toHaveBeenCalledWith({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
      });
    });
  });

  describe('when the back returns 409 Conflict', () => {
    it('throws EmailAlreadyRegisteredError', async () => {
      // Given un AuthHttp que rechaza con 409
      authHttp.registerUser.mockRejectedValue(
        new HttpErrorResponse({ status: 409, error: { error: 'Email already registered' } }),
      );

      // When intento registrar
      const accion = () =>
        service.register({
          email: 'juan@example.com',
          username: 'juancho',
          password: 'miPass123',
        });

      // Then se mapea al error de dominio
      await expect(accion).rejects.toThrow(EmailAlreadyRegisteredError);
    });
  });

  describe('when the back returns 400 Bad Request', () => {
    it('throws InvalidRegistrationDataError with the message from the back', async () => {
      // Given un back que rechaza por validacion
      authHttp.registerUser.mockRejectedValue(
        new HttpErrorResponse({ status: 400, error: { error: 'Invalid email format' } }),
      );

      // When intento registrar
      const accion = () =>
        service.register({
          email: 'no-es-email',
          username: 'juancho',
          password: 'miPass123',
        });

      // Then se mapea a InvalidRegistrationDataError con el mensaje
      await expect(accion).rejects.toThrow(InvalidRegistrationDataError);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {
      // Given un AuthHttp que falla con status 0 (sin conexion)
      authHttp.registerUser.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

      // When intento registrar
      const accion = () =>
        service.register({
          email: 'juan@example.com',
          username: 'juancho',
          password: 'miPass123',
        });

      // Then se mapea a NetworkError
      await expect(accion).rejects.toThrow(NetworkError);
    });
  });

  describe('when an unexpected error happens', () => {
    it('throws UnexpectedAuthError for non-HTTP errors', async () => {
      // Given un AuthHttp que tira un error random
      authHttp.registerUser.mockRejectedValue(new Error('boom'));

      // When intento registrar
      const accion = () =>
        service.register({
          email: 'juan@example.com',
          username: 'juancho',
          password: 'miPass123',
        });

      // Then se mapea a UnexpectedAuthError
      await expect(accion).rejects.toThrow(UnexpectedAuthError);
    });
  });
});

describe('AuthService.login', () => {
  let authHttp: { registerUser: ReturnType<typeof vi.fn>; loginUser: ReturnType<typeof vi.fn> };
  let tokenStorage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { registerUser: vi.fn(), loginUser: vi.fn() };
    tokenStorage = { save: vi.fn(), clear: vi.fn(), read: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: tokenStorage },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when the credentials are valid', () => {
    it('returns the tokens and persists them in storage', async () => {
      // Given un back que devuelve los dos tokens
      authHttp.loginUser.mockResolvedValue({
        accessToken: 'jwt-access',
        refreshToken: 'refresh-string',
      });

      // When llamo a login
      const tokens = await service.login({
        email: 'juan@example.com',
        password: 'miPass123',
      });

      // Then devuelve los tokens y los guarda en storage
      expect(tokens).toEqual({ accessToken: 'jwt-access', refreshToken: 'refresh-string' });
      expect(tokenStorage.save).toHaveBeenCalledWith({
        accessToken: 'jwt-access',
        refreshToken: 'refresh-string',
      });
    });

    it('normalizes the email/username before sending', async () => {
      // Given un back que acepta cualquier request
      authHttp.loginUser.mockResolvedValue({
        accessToken: 'jwt-access',
        refreshToken: 'refresh-string',
      });

      // When llamo con input sucio
      await service.login({
        email: '  JUAN@Example.com  ',
        password: 'miPass123',
      });

      // Then el back recibe el input normalizado en el campo email
      expect(authHttp.loginUser).toHaveBeenCalledWith({
        email: 'juan@example.com',
        password: 'miPass123',
      });
    });
  });

  describe('when the back returns 401 Unauthorized', () => {
    it('throws InvalidCredentialsError and does NOT save tokens', async () => {
      // Given un back que rechaza por credenciales invalidas
      authHttp.loginUser.mockRejectedValue(new HttpErrorResponse({ status: 401 }));

      // When intento loguear
      const accion = () =>
        service.login({ email: 'juan@example.com', password: 'mal' });

      // Then se mapea a InvalidCredentialsError y no se guardan tokens
      await expect(accion).rejects.toThrow(InvalidCredentialsError);
      expect(tokenStorage.save).not.toHaveBeenCalled();
    });
  });

  describe('when the back returns 429 Too Many Requests', () => {
    it('throws RateLimitedError', async () => {
      // Given un back que rate-limita
      authHttp.loginUser.mockRejectedValue(new HttpErrorResponse({ status: 429 }));

      // When intento loguear
      const accion = () =>
        service.login({ email: 'juan@example.com', password: 'miPass123' });

      // Then se mapea a RateLimitedError
      await expect(accion).rejects.toThrow(RateLimitedError);
    });
  });

  describe('when the back returns 400 Bad Request', () => {
    it('throws InvalidLoginDataError with the message from the back', async () => {
      // Given un back que rechaza por body invalido
      authHttp.loginUser.mockRejectedValue(
        new HttpErrorResponse({ status: 400, error: { error: 'email is required' } }),
      );

      // When intento loguear
      const accion = () =>
        service.login({ email: '', password: 'miPass123' });

      // Then se mapea a InvalidLoginDataError con el mensaje
      await expect(accion).rejects.toThrow(InvalidLoginDataError);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {
      // Given un AuthHttp que falla con status 0
      authHttp.loginUser.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

      // When intento loguear
      const accion = () =>
        service.login({ email: 'juan@example.com', password: 'miPass123' });

      // Then se mapea a NetworkError
      await expect(accion).rejects.toThrow(NetworkError);
    });
  });
});

describe('AuthService.refreshSession', () => {
  let authHttp: { refreshAccessToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let tokenStorage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { refreshAccessToken: vi.fn(), logout: vi.fn() };
    tokenStorage = { save: vi.fn(), clear: vi.fn(), read: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: tokenStorage },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when there is a stored refresh token', () => {
    it('returns the new access token and persists it keeping the same refresh', async () => {
      // Given tokens guardados y un back que devuelve un access nuevo
      tokenStorage.read.mockReturnValue({ accessToken: 'old-access', refreshToken: 'refresh-1' });
      authHttp.refreshAccessToken.mockResolvedValue({ accessToken: 'new-access' });

      // When refresco la sesion
      const accessToken = await service.refreshSession();

      // Then devuelve el access nuevo, manda el refresh viejo y lo persiste sin rotar el refresh
      expect(accessToken).toBe('new-access');
      expect(authHttp.refreshAccessToken).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
      expect(tokenStorage.save).toHaveBeenCalledWith({
        accessToken: 'new-access',
        refreshToken: 'refresh-1',
      });
    });
  });

  describe('when there is no stored token', () => {
    it('throws SessionExpiredError and does NOT hit the back', async () => {
      // Given storage vacio
      tokenStorage.read.mockReturnValue(null);

      // When intento refrescar
      const accion = () => service.refreshSession();

      // Then se corta antes de pegarle a /refresh
      await expect(accion).rejects.toThrow(SessionExpiredError);
      expect(authHttp.refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('when called concurrently', () => {
    it('shares a single in-flight refresh', async () => {
      // Given tokens guardados y un back que devuelve un access nuevo
      tokenStorage.read.mockReturnValue({ accessToken: 'old-access', refreshToken: 'refresh-1' });
      authHttp.refreshAccessToken.mockResolvedValue({ accessToken: 'new-access' });

      // When disparo dos refresh casi simultaneos
      const [first, second] = await Promise.all([
        service.refreshSession(),
        service.refreshSession(),
      ]);

      // Then ambos resuelven al mismo access y solo se pego una vez al back
      expect(first).toBe('new-access');
      expect(second).toBe('new-access');
      expect(authHttp.refreshAccessToken).toHaveBeenCalledTimes(1);
    });
  });
});

describe('AuthService.logout', () => {
  let authHttp: { refreshAccessToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let tokenStorage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { refreshAccessToken: vi.fn(), logout: vi.fn() };
    tokenStorage = { save: vi.fn(), clear: vi.fn(), read: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: tokenStorage },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when there is a stored refresh token', () => {
    it('revokes it on the back and then clears local storage', async () => {
      // Given tokens guardados y un back que revoca OK
      tokenStorage.read.mockReturnValue({ accessToken: 'access-1', refreshToken: 'refresh-1' });
      authHttp.logout.mockResolvedValue(undefined);

      // When cierro sesion
      await service.logout();

      // Then revoca el refresh en el back y limpia local
      expect(authHttp.logout).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
      expect(tokenStorage.clear).toHaveBeenCalled();
    });
  });

  describe('when the back fails to revoke', () => {
    it('still clears local storage (best-effort revoke)', async () => {
      // Given un back que falla la revocacion
      tokenStorage.read.mockReturnValue({ accessToken: 'access-1', refreshToken: 'refresh-1' });
      authHttp.logout.mockRejectedValue(new HttpErrorResponse({ status: 500 }));

      // When cierro sesion
      await service.logout();

      // Then igual limpia la sesion local
      expect(tokenStorage.clear).toHaveBeenCalled();
    });
  });

  describe('when there is no stored token', () => {
    it('clears storage without hitting the back', async () => {
      // Given storage vacio
      tokenStorage.read.mockReturnValue(null);

      // When cierro sesion
      await service.logout();

      // Then no le pega al back pero igual limpia
      expect(authHttp.logout).not.toHaveBeenCalled();
      expect(tokenStorage.clear).toHaveBeenCalled();
    });
  });
});
