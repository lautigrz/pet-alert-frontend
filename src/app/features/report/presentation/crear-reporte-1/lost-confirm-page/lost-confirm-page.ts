import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { ReportService } from '../../../application/report.service';
import { PetService } from '../../../../pet/application/pet.service';
import { ToastService } from '../../../../../shared/application/toast.service';

@Component({
  selector: 'app-lost-confirm-page',
  standalone: true,
  imports: [],
  host: { class: 'flex flex-1' },
  templateUrl: './lost-confirm-page.html',
})
export class LostConfirmPage implements OnInit {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);
  private reportService = inject(ReportService);
  private petService = inject(PetService);
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
    const pet = report.pet;
    const location = report.location;

    if (!pet) {
      this.error.set('Información de la mascota incompleta');
      this.isLoading.set(false);
      return;
    }

    try {
      const dataUrls = pet.imageUrls ?? [];
      const photoFiles = await Promise.all(
        dataUrls.map(async (url, i) => {
          const blob = await fetch(url).then((r) => r.blob());
          return new File([blob], `mascota-${i + 1}.jpg`, {
            type: blob.type || 'image/jpeg',
          });
        }),
      );

      const petResult = await this.petService.createPet({
        name: pet.name,
        species: pet.species,
        gender: pet.gender,
        size: pet.size,
        color: pet.color?.trim() ?? '',
        hasIdCollar: pet.hasIdentification === 'si',
        isVaccinated: pet.vaccinated === 'si',
        breed: pet.breed?.trim() ?? '',
        photos: photoFiles,
      });

      const result = await this.reportService.submitLostReport({
        petId: petResult.publicId,
        occurredAt: (location?.lastSeen && location.lastSeen.toString() !== 'Invalid Date') ? location.lastSeen : new Date(),
        location: {
          address: location?.address ?? '',
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
          city: location?.city ?? '',
        },
        description: pet.description?.trim() ?? '',
      });

      this.wizardService.resetReport();
      this.router.navigate(['/home'], { queryParams: { reporte: result.publicId } });
    } catch (err) {
      const e = err as { error?: { error?: string }; message?: string };
      const msg = e?.error?.error ?? e?.message ?? 'Ocurrió un error al crear el reporte.';
      this.error.set(msg);
      this.toastService.error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }
}
