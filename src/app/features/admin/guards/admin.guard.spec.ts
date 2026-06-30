import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { adminGuard, adminGuestGuard } from './admin.guard';
import { TokenStorage } from '../../auth/infrastructure/token.storage';
import { ProfileService } from '../../profile/application/profile.service';

describe('adminGuard', () => {
  function setup(tokens: unknown, profile?: { role: string | null } | Error) {
    const tokenStorage = { read: vi.fn().mockReturnValue(tokens) };
    const getProfile =
      profile instanceof Error
        ? vi.fn().mockRejectedValue(profile)
        : vi.fn().mockResolvedValue(profile);
    const router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: TokenStorage, useValue: tokenStorage },
        { provide: ProfileService, useValue: { getProfile } },
        { provide: Router, useValue: router },
      ],
    });
    const run = () =>
      TestBed.runInInjectionContext(() =>
        adminGuard(
          {} as unknown as ActivatedRouteSnapshot,
          {} as unknown as RouterStateSnapshot,
        ),
      );
    return { run, getProfile, router };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('redirects to /admin/login when there is no token', async () => {
    // Given sin sesión
    const { run, getProfile, router } = setup(null);

    // When corro el guard
    const result = await run();

    // Then bloquea sin consultar el perfil
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('allows access when the user is ADMIN', async () => {
    // Given un usuario admin logueado
    const { run, router } = setup({ accessToken: 'a', refreshToken: 'r' }, { role: 'ADMIN' });

    // When
    const result = await run();

    // Then deja pasar
    expect(result).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('blocks a non-admin user', async () => {
    // Given un usuario logueado sin rol admin
    const { run, router } = setup({ accessToken: 'a', refreshToken: 'r' }, { role: 'USER' });

    // When
    const result = await run();

    // Then lo manda al login de admin
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });

  it('blocks when the profile cannot be fetched', async () => {
    // Given una sesión cuyo perfil falla
    const { run, router } = setup({ accessToken: 'a', refreshToken: 'r' }, new Error('boom'));

    // When
    const result = await run();

    // Then bloquea
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });
});

describe('adminGuestGuard', () => {
  function setup(tokens: unknown, profile?: { role: string | null } | Error) {
    const tokenStorage = { read: vi.fn().mockReturnValue(tokens) };
    const getProfile =
      profile instanceof Error
        ? vi.fn().mockRejectedValue(profile)
        : vi.fn().mockResolvedValue(profile);
    const router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: TokenStorage, useValue: tokenStorage },
        { provide: ProfileService, useValue: { getProfile } },
        { provide: Router, useValue: router },
      ],
    });
    const run = () =>
      TestBed.runInInjectionContext(() =>
        adminGuestGuard(
          {} as unknown as ActivatedRouteSnapshot,
          {} as unknown as RouterStateSnapshot,
        ),
      );
    return { run, router };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('shows the admin login when there is no session', async () => {
    // Given sin sesión
    const { run, router } = setup(null);

    // When
    const result = await run();

    // Then deja ver el login admin
    expect(result).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('redirects a logged-in admin to /admin', async () => {
    // Given un admin logueado
    const { run, router } = setup({ accessToken: 'a', refreshToken: 'r' }, { role: 'ADMIN' });

    // When
    const result = await run();

    // Then lo manda al panel
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('redirects a logged-in non-admin to /home', async () => {
    // Given un usuario logueado sin rol admin
    const { run, router } = setup({ accessToken: 'a', refreshToken: 'r' }, { role: 'USER' });

    // When
    const result = await run();

    // Then lo saca a la app normal
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
  });
});
