import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { ReportService } from '../application/report.service';
import { AuthService } from '../../auth/application/auth.service';
import { ToastService } from '../../../shared/application/toast.service';

export const reportOwnerGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const reportService = inject(ReportService);
  const authService = inject(AuthService);
  const toast = inject(ToastService);
  const router = inject(Router);

  const publicId = route.paramMap.get('publicId');
  if (!publicId) {
    router.navigateByUrl('/home');
    return false;
  }

  try {
    const report = await reportService.getReportByPublicId(publicId);
    if (report.user.publicId !== authService.getCurrentUserId()) {
      toast.error('No podés editar un reporte que no es tuyo.');
    } else if (report.status !== 'ACTIVE') {
      toast.error('No podés editar un reporte cerrado o resuelto.');
    } else {
      return true;
    }
  } catch {
    router.navigateByUrl(`/reports/${publicId}`);
    return false;
  }

  router.navigateByUrl(`/reports/${publicId}`);
  return false;
};
