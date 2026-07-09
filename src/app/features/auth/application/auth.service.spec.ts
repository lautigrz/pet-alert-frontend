import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { AuthHttp } from '../infrastructure/auth.http';
import { TokenStorage } from '../infrastructure/token.storage';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidLoginDataError,
  InvalidRegistrationDataError,
  NetworkError,
  RateLimitedError,
  SessionExpiredError,
  UnexpectedAuthError,
  InvalidVerificationTokenError,
  GoogleSignInError,
} from '../domain/auth.errors';

const socketServiceMock = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

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
        { provide: SocketService, useValue: socketServiceMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when the back creates the user', () => {
    it('returns the registered user id and sends username to the back', async () => {

      authHttp.registerUser.mockResolvedValue({ id: 'uuid-abc' });


      const result = await service.register({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
      });


      expect(result).toEqual({ id: 'uuid-abc' });
      expect(authHttp.registerUser).toHaveBeenCalledWith({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
      });
    });

    it('normalizes the email and trims the username before sending', async () => {

      authHttp.registerUser.mockResolvedValue({ id: 'uuid-abc' });


      await service.register({
        email: '  JUAN@Example.com  ',
        username: '  juancho  ',
        password: 'miPass123',
      });


      expect(authHttp.registerUser).toHaveBeenCalledWith({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
      });
    });
  });

  describe('when the back returns 409 Conflict', () => {
    it('throws EmailAlreadyRegisteredError', async () => {

      authHttp.registerUser.mockRejectedValue(
        new HttpErrorResponse({ status: 409, error: { error: 'Email already registered' } }),
      );


      const accion = () =>
        service.register({
          email: 'juan@example.com',
          username: 'juancho',
          password: 'miPass123',
        });


      await expect(accion).rejects.toThrow(EmailAlreadyRegisteredError);
    });
  });

  describe('when the back returns 400 Bad Request', () => {
    it('throws InvalidRegistrationDataError with the message from the back', async () => {

      authHttp.registerUser.mockRejectedValue(
        new HttpErrorResponse({ status: 400, error: { error: 'Invalid email format' } }),
      );


      const accion = () =>
        service.register({
          email: 'no-es-email',
          username: 'juancho',
          password: 'miPass123',
        });


      await expect(accion).rejects.toThrow(InvalidRegistrationDataError);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {

      authHttp.registerUser.mockRejectedValue(new HttpErrorResponse({ status: 0 }));


      const accion = () =>
        service.register({
          email: 'juan@example.com',
          username: 'juancho',
          password: 'miPass123',
        });


      await expect(accion).rejects.toThrow(NetworkError);
    });
  });

  describe('when an unexpected error happens', () => {
    it('throws UnexpectedAuthError for non-HTTP errors', async () => {

      authHttp.registerUser.mockRejectedValue(new Error('boom'));

      // When intento registrar
      const accion = () =>
        service.register({
          email: 'juan@example.com',
          username: 'juancho',
          password: 'miPass123',
        });


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
        { provide: SocketService, useValue: socketServiceMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when the credentials are valid', () => {
    it('returns the tokens and persists them in storage', async () => {

      authHttp.loginUser.mockResolvedValue({
        accessToken: 'jwt-access',
        refreshToken: 'refresh-string',
      });

      // When llamo a login
      const tokens = await service.login({
        email: 'juan@example.com',
        password: 'miPass123',
      });


      expect(tokens).toEqual({ accessToken: 'jwt-access', refreshToken: 'refresh-string' });
      expect(tokenStorage.save).toHaveBeenCalledWith({
        accessToken: 'jwt-access',
        refreshToken: 'refresh-string',
      });
      expect(socketServiceMock.connect).toHaveBeenCalledWith('jwt-access', expect.any(Function));

      const callback = vi.mocked(socketServiceMock.connect).mock.calls[0][1];
      expect(callback).toBeDefined();
      if (callback) {
        vi.spyOn(service, 'refreshSession').mockResolvedValue('new-access-token');
        await callback();
        expect(service.refreshSession).toHaveBeenCalled();
      }
    });

    it('normalizes the email/username before sending', async () => {

      authHttp.loginUser.mockResolvedValue({
        accessToken: 'jwt-access',
        refreshToken: 'refresh-string',
      });


      await service.login({
        email: '  JUAN@Example.com  ',
        password: 'miPass123',
      });


      expect(authHttp.loginUser).toHaveBeenCalledWith({
        email: 'juan@example.com',
        password: 'miPass123',
      });
    });
  });

  describe('when the back returns 401 Unauthorized', () => {
    it('throws InvalidCredentialsError and does NOT save tokens', async () => {

      authHttp.loginUser.mockRejectedValue(new HttpErrorResponse({ status: 401 }));


      const accion = () =>
        service.login({ email: 'juan@example.com', password: 'mal' });


      await expect(accion).rejects.toThrow(InvalidCredentialsError);
      expect(tokenStorage.save).not.toHaveBeenCalled();
    });
  });

  describe('when the back returns 429 Too Many Requests', () => {
    it('throws RateLimitedError', async () => {

      authHttp.loginUser.mockRejectedValue(new HttpErrorResponse({ status: 429 }));


      const accion = () =>
        service.login({ email: 'juan@example.com', password: 'miPass123' });


      await expect(accion).rejects.toThrow(RateLimitedError);
    });
  });

  describe('when the back returns 400 Bad Request', () => {
    it('throws InvalidLoginDataError with the message from the back', async () => {

      authHttp.loginUser.mockRejectedValue(
        new HttpErrorResponse({ status: 400, error: { error: 'email is required' } }),
      );


      const accion = () =>
        service.login({ email: '', password: 'miPass123' });

      await expect(accion).rejects.toThrow(InvalidLoginDataError);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {

      authHttp.loginUser.mockRejectedValue(new HttpErrorResponse({ status: 0 }));


      const accion = () =>
        service.login({ email: 'juan@example.com', password: 'miPass123' });

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
        { provide: SocketService, useValue: socketServiceMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when there is a stored refresh token', () => {
    it('returns the new access token and persists it keeping the same refresh', async () => {

      tokenStorage.read.mockReturnValue({ accessToken: 'old-access', refreshToken: 'refresh-1' });
      authHttp.refreshAccessToken.mockResolvedValue({ accessToken: 'new-access' });


      const accessToken = await service.refreshSession();


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

      tokenStorage.read.mockReturnValue(null);


      const accion = () => service.refreshSession();


      await expect(accion).rejects.toThrow(SessionExpiredError);
      expect(authHttp.refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('when called concurrently', () => {
    it('shares a single in-flight refresh', async () => {

      tokenStorage.read.mockReturnValue({ accessToken: 'old-access', refreshToken: 'refresh-1' });
      authHttp.refreshAccessToken.mockResolvedValue({ accessToken: 'new-access' });


      const [first, second] = await Promise.all([
        service.refreshSession(),
        service.refreshSession(),
      ]);

      expect(first).toBe('new-access');
      expect(second).toBe('new-access');
      expect(authHttp.refreshAccessToken).toHaveBeenCalledTimes(1);
    });
  });
});

describe('AuthService.logout', () => {
  let authHttp: { refreshAccessToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let tokenStorage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let notificationsService: { clear: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { refreshAccessToken: vi.fn(), logout: vi.fn() };
    tokenStorage = { save: vi.fn(), clear: vi.fn(), read: vi.fn() };
    notificationsService = { clear: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: tokenStorage },
        { provide: SocketService, useValue: socketServiceMock },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when there is a stored refresh token', () => {
    it('revokes it on the back and then clears local storage and notifications', async () => {
      tokenStorage.read.mockReturnValue({ accessToken: 'access-1', refreshToken: 'refresh-1' });
      authHttp.logout.mockResolvedValue(undefined);

      await service.logout();


      expect(authHttp.logout).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
      expect(tokenStorage.clear).toHaveBeenCalled();
      expect(notificationsService.clear).toHaveBeenCalled();
    });
  });

  describe('when the back fails to revoke', () => {
    it('still clears local storage (best-effort revoke)', async () => {

      tokenStorage.read.mockReturnValue({ accessToken: 'access-1', refreshToken: 'refresh-1' });
      authHttp.logout.mockRejectedValue(new HttpErrorResponse({ status: 500 }));


      await service.logout();

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
      expect(notificationsService.clear).toHaveBeenCalled();
    });
  });
});

describe('AuthService.verifyEmail', () => {
  let authHttp: { verifyEmail: ReturnType<typeof vi.fn> };
  let tokenStorage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { verifyEmail: vi.fn() };
    tokenStorage = { save: vi.fn(), clear: vi.fn(), read: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: tokenStorage },
        { provide: SocketService, useValue: socketServiceMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when the back confirms the verification', () => {
    it('resolves and sends the token to the back', async () => {
      // Given un back que confirma la verificación
      authHttp.verifyEmail.mockResolvedValue({ verified: true });

      // When verifico el email
      await expect(service.verifyEmail('tok-1')).resolves.toBeUndefined();

      // Then se envió el token al back
      expect(authHttp.verifyEmail).toHaveBeenCalledWith({ token: 'tok-1' });
    });
  });

  describe('when the back returns 400', () => {
    it('throws InvalidVerificationTokenError', async () => {
      // Given un back que rechaza el token
      authHttp.verifyEmail.mockRejectedValue(new HttpErrorResponse({ status: 400 }));

      // When intento verificar
      const accion = () => service.verifyEmail('mal');

      // Then se mapea al error de dominio
      await expect(accion).rejects.toThrow(InvalidVerificationTokenError);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {
      // Given un AuthHttp que falla con status 0
      authHttp.verifyEmail.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

      // When intento verificar
      const accion = () => service.verifyEmail('tok');

      // Then se mapea a NetworkError
      await expect(accion).rejects.toThrow(NetworkError);
    });
  });
});

describe('AuthService.loginWithGoogle', () => {
  let authHttp: { googleLogin: ReturnType<typeof vi.fn> };
  let tokenStorage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { googleLogin: vi.fn() };
    tokenStorage = { save: vi.fn(), clear: vi.fn(), read: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: tokenStorage },
        { provide: SocketService, useValue: socketServiceMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('when the back accepts the Google code', () => {
    it('returns the tokens, persists them and connects the socket', async () => {
      authHttp.googleLogin.mockResolvedValue({ accessToken: 'jwt-access', refreshToken: 'refresh-string' });

      const tokens = await service.loginWithGoogle('auth-code');

      expect(tokens).toEqual({ accessToken: 'jwt-access', refreshToken: 'refresh-string' });
      expect(authHttp.googleLogin).toHaveBeenCalledWith({ code: 'auth-code' });
      expect(tokenStorage.save).toHaveBeenCalledWith({ accessToken: 'jwt-access', refreshToken: 'refresh-string' });
      expect(socketServiceMock.connect).toHaveBeenCalledWith('jwt-access', expect.any(Function));
    });
  });

  describe('when the back rejects the Google identity', () => {
    it('throws GoogleSignInError and does NOT save tokens', async () => {
      authHttp.googleLogin.mockRejectedValue(new HttpErrorResponse({ status: 401 }));

      const accion = () => service.loginWithGoogle('auth-code');

      await expect(accion).rejects.toThrow(GoogleSignInError);
      expect(tokenStorage.save).not.toHaveBeenCalled();
    });
  });

  describe('when the back returns 429 Too Many Requests', () => {
    it('throws RateLimitedError', async () => {
      authHttp.googleLogin.mockRejectedValue(new HttpErrorResponse({ status: 429 }));

      const accion = () => service.loginWithGoogle('auth-code');

      await expect(accion).rejects.toThrow(RateLimitedError);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {
      authHttp.googleLogin.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

      const accion = () => service.loginWithGoogle('auth-code');

      await expect(accion).rejects.toThrow(NetworkError);
    });
  });
});
