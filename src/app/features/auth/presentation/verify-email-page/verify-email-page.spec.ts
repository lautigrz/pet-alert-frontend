import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerifyEmailPage } from './verify-email-page';
import { AuthService } from '../../application/auth.service';
import { InvalidVerificationTokenError, NetworkError } from '../../domain/auth.errors';

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('VerifyEmailPage', () => {
  let authService: { verifyEmail: ReturnType<typeof vi.fn> };
  let router: Router;

  const buildComponent = (token: string | null) => {
    const activatedRoute = {
      snapshot: { queryParamMap: { get: (k: string) => (k === 'token' ? token : null) } },
    };
    TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    });
    const fixture = TestBed.createComponent(VerifyEmailPage);
    router = TestBed.inject(Router);
    return fixture;
  };

  beforeEach(() => {
    authService = { verifyEmail: vi.fn() };
  });

  it('redirige a login con verified=ok cuando el token es válido', async () => {
    // Given un service que verifica OK
    authService.verifyEmail.mockResolvedValue(undefined);
    const fixture = buildComponent('tok-1');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // When se inicializa
    fixture.detectChanges();
    await flush();

    // Then verifica y redirige con el resultado ok
    expect(authService.verifyEmail).toHaveBeenCalledWith('tok-1');
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { verified: 'ok' } });
  });

  it('redirige a login con verified=error cuando el token es inválido', async () => {
    // Given un token inválido/expirado
    authService.verifyEmail.mockRejectedValue(new InvalidVerificationTokenError());
    const fixture = buildComponent('mal');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // When se inicializa
    fixture.detectChanges();
    await flush();

    // Then redirige con el resultado error
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { verified: 'error' } });
  });

  it('redirige con verified=error y NO llama al service si no hay token', async () => {
    // Given una URL sin token
    const fixture = buildComponent(null);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // When se inicializa
    fixture.detectChanges();
    await flush();

    // Then no se pega al back y redirige como error
    expect(authService.verifyEmail).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { verified: 'error' } });
  });

  it('se queda en estado retry (sin redirigir) ante un error de red', async () => {
    // Given el back caído / sin red
    authService.verifyEmail.mockRejectedValue(new NetworkError());
    const fixture = buildComponent('tok-1');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // When se inicializa
    fixture.detectChanges();
    await flush();

    // Then ofrece reintentar y NO redirige
    expect(fixture.componentInstance.status()).toBe('retry');
    expect(navigate).not.toHaveBeenCalled();
  });
});
