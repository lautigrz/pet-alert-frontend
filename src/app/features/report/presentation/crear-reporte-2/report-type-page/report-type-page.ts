import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { ReportType } from '../../../domain/report.model';

@Component({
  selector: 'app-report-type-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-type-page.html',
  styleUrl: './report-type-page.css',
})
export class ReportTypePage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);

  selectType(type: ReportType) {
    this.wizardService.setType(type);
    this.router.navigate(['/report/data']);
  }

  selectFound() {
    this.router.navigate(['/report/found-type']);
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
