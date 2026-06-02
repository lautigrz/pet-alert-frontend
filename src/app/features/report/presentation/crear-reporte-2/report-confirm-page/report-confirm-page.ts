import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { ReportService } from '../../../application/report.service';
import { ToastService } from '../../../../../shared/application/toast.service';

@Component({
  selector: 'app-report-confirm-page',
  standalone: true,
  imports: [],
  templateUrl: './report-confirm-page.html',
})
export class ReportConfirmPage implements OnInit {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);
  private reportService = inject(ReportService);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  error = signal<string | null>(null);

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
      const dataUrls = report.pet?.imageUrls ?? [];
      const photoFiles = await Promise.all(
        dataUrls.map(async (url, i) => {
          const blob = await fetch(url).then((r) => r.blob());
          return new File([blob], `avistamiento-${i + 1}.jpg`, {
            type: blob.type || 'image/jpeg',
          });
        }),
      );

      const result = await this.reportService.submitSightingReport({
        animalType: this.mapAnimalType(sightingDetails.animalType),
        hasIdCollar: sightingDetails.hasIdCollar,
        color: report.pet?.color?.trim() ?? '',
        isInTransit: sightingDetails.isInTransit,
        occurredAt: (location?.lastSeen && location.lastSeen.toString() !== 'Invalid Date') ? location.lastSeen : new Date(),
        location: {
          address: location?.address ?? '',
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
          city: location?.city ?? '',
        },
        description: report.pet?.description?.trim() ?? '',
        photos: photoFiles.length ? photoFiles : undefined,
      });

      this.wizardService.resetReport();
      this.router.navigate(['/home'], { queryParams: { reporte: result.publicId } });
    } catch (err) {
      const e = err as { error?: { error?: string }; message?: string };
      const msg = e?.error?.error ?? e?.message ?? 'Ocurrió un error al crear el avistamiento.';
      this.error.set(msg);
      this.toastService.error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapAnimalType(animalType: string): 'DOG' | 'CAT' {
    const clean = animalType?.toLowerCase()?.trim();
    return clean === 'perro' || clean === 'dog' ? 'DOG' : 'CAT';
  }
}
