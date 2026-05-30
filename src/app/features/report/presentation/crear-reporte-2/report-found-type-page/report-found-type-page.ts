import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';

@Component({
  selector: 'app-report-found-type-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-found-type-page.html',
  styleUrl: './report-found-type-page.css',
})
export class ReportFoundTypePage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);

  selectSighting() {
    this.wizardService.setType('sighting');
    this.router.navigate(['/report/data']);
  }

  selectTransit() {
    // TODO: Implementar tránsito después
    console.log('Tránsito - por implementar');
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
