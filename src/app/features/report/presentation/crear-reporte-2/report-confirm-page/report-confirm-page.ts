import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { ReportService } from '../../../application/report.service';
import { ToastService } from '../../../../../shared/application/toast.service';

@Component({
  selector: 'app-report-confirm-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-confirm-page.html',
  styleUrl: './report-confirm-page.css',
})
export class ReportConfirmPage implements OnInit {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);
  private reportService = inject(ReportService);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  reportId = signal('');
  error = signal<string | null>(null);
  success = signal(false);

  ngOnInit() {
    this.submitReport();
  }

  async submitReport() {
    this.isLoading.set(true);
    this.error.set(null);

    const report = this.wizardService.getCurrentReport();
    const location = report.location;
    const sightingDetails = report.sightingDetails;

    if (!sightingDetails) {
      this.error.set('Información de avistamiento incompleta');
      this.isLoading.set(false);
      return;
    }

    try {
      
      const result = await this.reportService.submitSightingReport({
        animalType: this.mapAnimalType(sightingDetails.animalType) as any,
        hasIdCollar: sightingDetails.hasIdCollar,
        color: report.pet?.description?.trim() ?? '',
        isInTransit: false,
        
        occurredAt: (location?.lastSeen && location.lastSeen.toString() !== 'Invalid Date') ? location.lastSeen : new Date(),
        location: {
          address: location?.address ?? '',
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
          city: location?.city ?? '',
        },
        description: report.pet?.description?.trim() ?? '',
        photos: report.pet?.imageUrl ? [report.pet.imageUrl as any] : undefined,
      });

      this.success.set(true);
      this.reportId.set(result.publicId);
      this.toastService.success('¡Avistamiento reportado exitosamente!');
      this.wizardService.resetReport();
    } catch (err: any) {
      const msg = err?.error?.error ?? err?.message ?? 'Ocurrió un error al crear el avistamiento.';
      this.error.set(msg);
      this.toastService.error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

 
  private mapAnimalType(animalType: string): 'DOG' | 'CAT' {
    const clean = animalType?.toLowerCase()?.trim();
    return (clean === 'perro' || clean === 'dog' ? 'DOG' : 'CAT') as any;
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
