import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { reportOwnerGuard } from './report-owner.guard';
import { ReportService } from '../application/report.service';
import { AuthService } from '../../auth/application/auth.service';
import { ToastService } from '../../../shared/application/toast.service';

const PUBLIC_ID = 'report-uuid-1';

describe('reportOwnerGuard', () => {
  function setup(
    options: {
      publicId?: string | null;
      ownerId?: string;
      currentUserId?: string | null;
      status?: string;
      loadFails?: boolean;
    } = {},
  ) {
    const {
      publicId = PUBLIC_ID,
      ownerId = 'owner-uuid',
      currentUserId = 'owner-uuid',
      status = 'ACTIVE',
      loadFails = false,
    } = options;

    const getReportByPublicId = loadFails
      ? vi.fn().mockRejectedValue(new Error('boom'))
      : vi.fn().mockResolvedValue({ user: { publicId: ownerId }, status });
    const getCurrentUserId = vi.fn().mockReturnValue(currentUserId);
    const toast = { error: vi.fn() };
    const router = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ReportService, useValue: { getReportByPublicId } },
        { provide: AuthService, useValue: { getCurrentUserId } },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });

    const route = {
      paramMap: { get: () => publicId },
    } as unknown as ActivatedRouteSnapshot;

    const run = () =>
      TestBed.runInInjectionContext(() => reportOwnerGuard(route, {} as never));

    return { run, getReportByPublicId, toast, router };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('deja pasar cuando el usuario es el dueño del reporte', async () => {
    const { run, toast, router } = setup({ ownerId: 'owner-uuid', currentUserId: 'owner-uuid' });

    const result = await run();

    expect(result).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('bloquea y redirige al detalle cuando no es el dueño', async () => {
    const { run, toast, router } = setup({ ownerId: 'otro-uuid', currentUserId: 'owner-uuid' });

    const result = await run();

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith(`/reports/${PUBLIC_ID}`);
  });

  it('bloquea y redirige al detalle si el reporte no está activo (cerrado/resuelto)', async () => {
    const { run, toast, router } = setup({ ownerId: 'owner-uuid', currentUserId: 'owner-uuid', status: 'CLOSED' });

    const result = await run();

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith(`/reports/${PUBLIC_ID}`);
  });

  it('bloquea y redirige al detalle si el reporte no se puede cargar', async () => {
    const { run, toast, router } = setup({ loadFails: true });

    const result = await run();

    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith(`/reports/${PUBLIC_ID}`);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('redirige a /home si la ruta no trae publicId', async () => {
    const { run, getReportByPublicId, router } = setup({ publicId: null });

    const result = await run();

    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    expect(getReportByPublicId).not.toHaveBeenCalled();
  });
});
