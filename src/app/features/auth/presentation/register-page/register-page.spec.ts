import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterPage } from './register-page';
import { AuthService } from '../../application/auth.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { EmailAlreadyRegisteredError, NetworkError } from '../../domain/auth.errors';

describe('RegisterPage', () => {
  let authService: { register: ReturnType<typeof vi.fn> };
  let toastService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let router: Router;
  let component: RegisterPage;

  beforeEach(() => {
    authService = { register: vi.fn() };
    toastService = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService },
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
      expect(navigateSpy).toHaveBeenCalledWith('/login?verification=sent');
    });

    it('shows the server error inline when register fails with a specific error', async () => {
      // Given: el service rechaza con EmailAlreadyRegistered (error especifico del form)
      authService.register.mockRejectedValue(new EmailAlreadyRegisteredError());

      // When: envio
      await component.submit();

      // Then: serverError se popula inline, NO se dispara toast
      expect(component.serverError()).toBe('Ya existe una cuenta con ese correo');
      expect(toastService.error).not.toHaveBeenCalled();
      expect(component.submitting()).toBe(false);
    });

    it('dispatches a toast when register fails with a global error like NetworkError', async () => {
      // Given: el service rechaza con NetworkError (error global, no de campo)
      authService.register.mockRejectedValue(new NetworkError());

      // When: envio
      await component.submit();

      // Then: el toast se dispara, serverError queda en null
      expect(toastService.error).toHaveBeenCalledWith(
        'No pudimos conectar con el servidor. Reintentá en unos segundos.',
      );
      expect(component.serverError()).toBeNull();
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
