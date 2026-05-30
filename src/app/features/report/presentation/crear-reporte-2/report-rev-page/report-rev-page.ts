import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';

@Component({
  selector: 'app-report-rev-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-rev-page.html',
  styleUrl: './report-rev-page.css',
})
export class ReportRevPage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);

  report = this.wizardService.report;
  reportType = computed(() =>
    this.report().type === 'lost' ? 'Mascota Perdida' : 'Mascota Encontrada'
  );

  nextStep() {
    this.router.navigate(['/report/confirm']);
  }

  previousStep() {
    this.router.navigate(['/report/location']);
  }
}
