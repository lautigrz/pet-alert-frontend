import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { AuthHttp } from '../infrastructure/auth.http';
import {
  EmailAlreadyRegisteredError,
  InvalidRegistrationDataError,
  NetworkError,
  UnexpectedAuthError,
} from '../domain/auth.errors';

describe('AuthService.register', () => {
  let authHttp: { registerUser: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    authHttp = { registerUser: vi.fn() };
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: AuthHttp, useValue: authHttp }],
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
