import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';

@Component({
  selector: 'app-lost-rev-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lost-rev-page.html',
  styleUrl: './lost-rev-page.css',
})
export class LostRevPage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);

  report = this.wizardService.report;
  reportType = computed(() => 'Mascota Perdida');

  nextStep() {
    this.router.navigate(['/report/lost-confirm']);
  }

  previousStep() {
    this.router.navigate(['/report/lost-location']);
  }
}
