import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ReportWizardService } from '../application/report-wizard.service';
import { PetReport } from '../domain/report.model';


export function wizardStepGuard(isAllowed: (report: PetReport) => boolean): CanActivateFn {
  return () => {
    const wizard = inject(ReportWizardService);
    const router = inject(Router);

    if (isAllowed(wizard.getCurrentReport())) {
      return true;
    }
    return router.createUrlTree(['/report/type']);
  };
}
