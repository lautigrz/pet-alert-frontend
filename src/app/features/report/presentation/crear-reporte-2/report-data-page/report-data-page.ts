import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WizardStepperComponent } from '../../../../../shared/component/wizard-stepper/wizard-stepper.component';
import { PetIconComponent } from '../../../../../shared/component/pet-icon/pet-icon.component';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { Pet, SightingDetails } from '../../../domain/report.model';
import { DOG_BREEDS, PET_COLORS } from '../../../domain/pet-options';
import { CatalogService } from '../../../application/catalog.service';
import { InfoTooltipComponent } from '../../../../../shared/component/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-report-data-page',
  standalone: true,
  imports: [RouterLink, WizardStepperComponent, PetIconComponent, InfoTooltipComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-data-page.html',
})
export class ReportDataPage {
  private readonly router = inject(Router);
  readonly wizardService = inject(ReportWizardService);

  readonly maxPhotos = 4;
  readonly slots = [0, 1, 2, 3];



  petName = signal('');
  petSpecies = signal<'perro' | 'gato'>('perro');
  petBreed = signal('');
  petColor = signal('');
  petDescription = signal('');
  petGender = signal<'macho' | 'hembra'>('macho');
  petSize = signal<'pequeño' | 'mediano' | 'grande'>('mediano');
  hasIdentification = signal<'si' | 'no'>('no');
  photos = signal<string[]>([]);

  private readonly catalog = inject(CatalogService);
  readonly colorOptions = signal<string[]>(PET_COLORS);
  readonly breedOptions = signal<string[]>(DOG_BREEDS);



  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    for (const file of files) {
      if (this.photos().length >= this.maxPhotos) break;
      const reader = new FileReader();
      reader.onload = () =>
        this.photos.update((p) =>
          p.length < this.maxPhotos ? [...p, reader.result as string] : p,
        );
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removePhoto(index: number) {
    this.photos.update((p) => p.filter((_, i) => i !== index));
  }

  nextStep() {
    const pet: Pet = {
      name: this.petName(),
      species: this.petSpecies(),
      breed: this.petBreed(),
      color: this.petColor(),
      description: this.petDescription(),
      gender: this.petGender(),
      size: this.petSize(),
      hasIdentification: this.hasIdentification(),
      imageUrl: this.photos()[0],
      imageUrls: this.photos(),
    };
    this.wizardService.setPetData(pet);

    const sightingDetails: SightingDetails = {
      animalType: this.petSpecies(),
      hasIdCollar: this.hasIdentification() === 'si',
      isInTransit: this.wizardService.inTransit(),
    };
    this.wizardService.setSightingDetails(sightingDetails);

    this.router.navigate(['/report/location']);
  }

  previousStep() {
    this.router.navigate(['/report/found-type']);
  }

  cancel() {
    this.router.navigate(['/home']);
  }
}
