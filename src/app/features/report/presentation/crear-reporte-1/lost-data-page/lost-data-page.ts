import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WizardStepperComponent } from '../../../../../shared/component/wizard-stepper/wizard-stepper.component';
import { PetIconComponent } from '../../../../../shared/component/pet-icon/pet-icon.component';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { Pet } from '../../../domain/report.model';
import { DOG_BREEDS, PET_COLORS } from '../../../domain/pet-options';
import { CatalogService } from '../../../application/catalog.service';

@Component({
  selector: 'app-lost-data-page',
  standalone: true,
  imports: [RouterLink, WizardStepperComponent, PetIconComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './lost-data-page.html',
})
export class LostDataPage {
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
  vaccinated = signal<'si' | 'no'>('no');
  photos = signal<string[]>([]);

  private readonly catalog = inject(CatalogService);
  readonly colorOptions = signal<string[]>(PET_COLORS);
  readonly breedOptions = signal<string[]>(DOG_BREEDS);

  constructor() {
    this.catalog.getColors().then((colors) => this.colorOptions.set(colors));
    effect(() => {
      const species = this.petSpecies() === 'gato' ? 'CAT' : 'DOG';
      this.catalog.getBreeds(species).then((breeds) => this.breedOptions.set(breeds));
    });

    const pet = this.wizardService.getCurrentReport().pet;
    if (!pet) return;
    this.petName.set(pet.name ?? '');
    this.petSpecies.set(pet.species ?? 'perro');
    this.petBreed.set(pet.breed ?? '');
    this.petColor.set(pet.color ?? '');
    this.petDescription.set(pet.description ?? '');
    this.petGender.set(pet.gender ?? 'macho');
    this.petSize.set(pet.size ?? 'mediano');
    this.hasIdentification.set(pet.hasIdentification ?? 'no');
    this.vaccinated.set(pet.vaccinated ?? 'no');
    this.photos.set(pet.imageUrls ?? []);
  }

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
      vaccinated: this.vaccinated(),
      imageUrl: this.photos()[0],
      imageUrls: this.photos(),
    };
    this.wizardService.setPetData(pet);
    this.router.navigate(['/report/location']);
  }

  previousStep() {
    this.router.navigate(['/report/type']);
  }

  cancel() {
    this.router.navigate(['/home']);
  }
}
