import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';

@Component({
  selector: 'app-report-confirm-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-confirm-page.html',
  styleUrl: './report-confirm-page.css',
})
export class ReportConfirmPage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);

  isLoading = false;
  reportId = '';
  error: string | null = null;

  ngOnInit() {
    this.submitReport();
  }

  submitReport() {
    this.isLoading = true;
    this.error = null;

    // Aquí es donde tu compa del backend recibirá el POST
    const report = this.wizardService.getCurrentReport();
    console.log('Enviando reporte:', report);

    // TODO: Llamar al backend con HTTP
    // this.reportHttp.createReport(report).subscribe(...)

    // Simulamos éxito por ahora
    setTimeout(() => {
      this.isLoading = false;
      this.reportId = 'REP-' + Math.random().toString(36).substring(7).toUpperCase();
    }, 2000);
  }

  createNewReport() {
    this.wizardService.resetReport();
    this.router.navigate(['/report/type']);
  }

  goHome() {
    this.wizardService.resetReport();
    this.router.navigate(['/']);
  }
}
