import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterPage } from './register-page';
import { AuthService } from '../../application/auth.service';
import { EmailAlreadyRegisteredError } from '../../domain/auth.errors';

describe('RegisterPage', () => {
  let authService: { register: ReturnType<typeof vi.fn> };
  let router: Router;
  let component: RegisterPage;

  beforeEach(() => {
    authService = { register: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    });
    const fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  describe('when the form is invalid', () => {
    it('does NOT call AuthService on submit', async () => {
      // Given: el form arranca vacio (invalido)
      // When: intento enviar
      await component.submit();

      // Then: NO se llama al service y el form queda touched
      expect(authService.register).not.toHaveBeenCalled();
      expect(component.form.touched).toBe(true);
    });
  });

  describe('when the form is valid', () => {
    beforeEach(() => {
      component.form.setValue({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
        passwordConfirm: 'miPass123',
      });
    });

    it('calls AuthService.register with the form values', async () => {
      // Given: un service que crea el user OK
      authService.register.mockResolvedValue({ id: 'uuid-abc' });
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');

      // When: envio
      await component.submit();

      // Then: el service se llamo con los valores del form y se redirige
      expect(authService.register).toHaveBeenCalledWith({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
      });
      expect(navigateSpy).toHaveBeenCalledWith('/verify-email-sent');
    });

    it('shows the server error message when register fails', async () => {
      // Given: el service rechaza con EmailAlreadyRegistered
      authService.register.mockRejectedValue(new EmailAlreadyRegisteredError());

      // When: envio
      await component.submit();

      // Then: serverError se popula con el mensaje
      expect(component.serverError()).toBe('Ya existe una cuenta con ese correo');
      expect(component.submitting()).toBe(false);
    });
  });

  describe('when passwords do not match', () => {
    it('marks the form as invalid', () => {
      // Given: passwords distintas
      component.form.setValue({
        email: 'juan@example.com',
        username: 'juancho',
        password: 'miPass123',
        passwordConfirm: 'OTRA',
      });
      component.form.markAllAsTouched();

      // Then: el form es invalido y passwordsMismatch() devuelve true
      expect(component.form.invalid).toBe(true);
      expect(component.passwordsMismatch()).toBe(true);
    });
  });
});
