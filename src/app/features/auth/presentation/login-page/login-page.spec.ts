import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './login-page';
import { AuthService } from '../../application/auth.service';
import { InvalidCredentialsError, RateLimitedError } from '../../domain/auth.errors';

describe('LoginPage', () => {
  let authService: { login: ReturnType<typeof vi.fn> };
  let router: Router;
  let component: LoginPage;

  beforeEach(() => {
    authService = { login: vi.fn() };
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    });
    const fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  describe('when the form is invalid', () => {
    it('does NOT call AuthService on submit', async () => {
      // Given: el form arranca vacio (invalido)
      // When: intento enviar
      await component.submit();

      // Then: NO se llama al service y el form queda touched
      expect(authService.login).not.toHaveBeenCalled();
      expect(component.form.touched).toBe(true);
    });
  });

  describe('when the form is valid', () => {
    beforeEach(() => {
      component.form.setValue({
        emailOrUsername: 'juan@example.com',
        password: 'miPass123',
      });
    });

    it('calls AuthService.login and redirects to home on success', async () => {
      // Given: un service que devuelve tokens
      authService.login.mockResolvedValue({
        accessToken: 'jwt-access',
        refreshToken: 'refresh-string',
      });
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');

      // When: envio
      await component.submit();

      // Then: el service se llamo con los valores y se redirige a la home
      expect(authService.login).toHaveBeenCalledWith({
        emailOrUsername: 'juan@example.com',
        password: 'miPass123',
      });
      expect(navigateSpy).toHaveBeenCalledWith('/');
    });

    it('shows InvalidCredentialsError message when login fails with 401', async () => {
      // Given: el service rechaza con InvalidCredentialsError
      authService.login.mockRejectedValue(new InvalidCredentialsError());

      // When: envio
      await component.submit();

      // Then: serverError se popula y submitting vuelve a false
      expect(component.serverError()).toBe('Correo o contraseña incorrectos');
      expect(component.submitting()).toBe(false);
    });

    it('shows RateLimitedError message when login fails with 429', async () => {
      // Given: el service rechaza con RateLimitedError
      authService.login.mockRejectedValue(new RateLimitedError());

      // When: envio
      await component.submit();

      // Then: serverError se popula con el mensaje de rate limit
      expect(component.serverError()).toBe(
        'Demasiados intentos. Esperá unos minutos antes de reintentar.',
      );
    });
  });

  describe('mobile flow', () => {
    it('starts on landing view by default', () => {
      // Then: la vista mobile arranca en landing
      expect(component.mobileView()).toBe('landing');
    });

    it('switches to form view when goToForm is called', () => {
      // When: cambio a la vista del form
      component.goToForm();

      // Then: la vista cambia
      expect(component.mobileView()).toBe('form');
    });
  });

  describe('client-side validation', () => {
    it('rejects passwords shorter than 8 characters', () => {
      // Given: password de 7 chars
      component.form.setValue({
        emailOrUsername: 'juan@example.com',
        password: '1234567',
      });

      // Then: el control de password es invalido por minlength
      expect(component.form.get('password')?.hasError('minlength')).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('rejects malformed input when it contains @ (treated as email)', () => {
      // Given: input con @ pero sin dominio valido
      component.form.setValue({
        emailOrUsername: 'juan@',
        password: 'miPass123',
      });

      // Then: el control falla con error de formato email
      expect(component.form.get('emailOrUsername')?.hasError('email')).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('accepts plain usernames without @ (no email format check)', () => {
      // Given: input sin @ (username)
      component.form.setValue({
        emailOrUsername: 'juancho',
        password: 'miPass123',
      });

      // Then: el form es valido (no se chequea formato email)
      expect(component.form.get('emailOrUsername')?.hasError('email')).toBeFalsy();
      expect(component.form.valid).toBe(true);
    });
  });
});
