import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { AuthHttp } from '../infrastructure/auth.http';
import { TokenStorage } from '../infrastructure/token.storage';
import {
  NetworkError,
  RateLimitedError,
  UnexpectedAuthError,
  InvalidResetTokenError,
} from '../domain/auth.errors';

describe('AuthService.requestPasswordReset', () => {
  let authHttp: { forgotPassword: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { forgotPassword: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: { save: vi.fn(), clear: vi.fn(), read: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('normaliza el email (trim + minúsculas) antes de enviarlo', async () => {
    authHttp.forgotPassword.mockResolvedValue(undefined);

    await service.requestPasswordReset('  Nicole@Test.COM  ');

    expect(authHttp.forgotPassword).toHaveBeenCalledWith({ email: 'nicole@test.com' });
  });

  it('mapea status 0 a NetworkError', async () => {
    authHttp.forgotPassword.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

    await expect(service.requestPasswordReset('a@b.com')).rejects.toThrow(NetworkError);
  });

  it('mapea status 429 a RateLimitedError', async () => {
    authHttp.forgotPassword.mockRejectedValue(new HttpErrorResponse({ status: 429 }));

    await expect(service.requestPasswordReset('a@b.com')).rejects.toThrow(RateLimitedError);
  });

  it('mapea un error inesperado a UnexpectedAuthError', async () => {
    authHttp.forgotPassword.mockRejectedValue(new Error('boom'));

    await expect(service.requestPasswordReset('a@b.com')).rejects.toThrow(UnexpectedAuthError);
  });
});

describe('AuthService.resetPassword', () => {
  let authHttp: { resetPassword: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { resetPassword: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthHttp, useValue: authHttp },
        { provide: TokenStorage, useValue: { save: vi.fn(), clear: vi.fn(), read: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('envía el token y la nueva contraseña al back', async () => {
    authHttp.resetPassword.mockResolvedValue(undefined);

    await service.resetPassword('tok-123', 'nuevaPass1');

    expect(authHttp.resetPassword).toHaveBeenCalledWith({
      token: 'tok-123',
      newPassword: 'nuevaPass1',
    });
  });

  it('mapea status 400 a InvalidResetTokenError', async () => {
    authHttp.resetPassword.mockRejectedValue(new HttpErrorResponse({ status: 400 }));

    await expect(service.resetPassword('tok', 'pass1234')).rejects.toThrow(InvalidResetTokenError);
  });

  it('mapea status 0 a NetworkError', async () => {
    authHttp.resetPassword.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

    await expect(service.resetPassword('tok', 'pass1234')).rejects.toThrow(NetworkError);
  });

  it('mapea un error inesperado a UnexpectedAuthError', async () => {
    authHttp.resetPassword.mockRejectedValue(new Error('boom'));

    await expect(service.resetPassword('tok', 'pass1234')).rejects.toThrow(UnexpectedAuthError);
  });
});
