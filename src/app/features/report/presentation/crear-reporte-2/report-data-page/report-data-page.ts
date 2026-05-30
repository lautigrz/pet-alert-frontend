import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { Pet, SightingDetails } from '../../../domain/report.model';

@Component({
  selector: 'app-report-data-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-data-page.html',
  styleUrl: './report-data-page.css',
})
export class ReportDataPage {
  private router = inject(Router);
  wizardService = inject(ReportWizardService);

  petName = signal('');
  petSpecies = signal<'perro' | 'gato'>('perro');
  petBreed = signal('');
  petDescription = signal('');
  petGender = signal<'macho' | 'hembra'>('macho');
  petSize = signal<'pequeño' | 'mediano' | 'grande'>('mediano');
  hasIdentification = signal<'si' | 'no'>('no');
  petImage = signal<string | null>(null);

  // Campos de avistamiento
  animalType = signal<'perro' | 'gato'>('perro');
  hasIdCollar = signal(false);

  isSighting = computed(() => this.wizardService.getCurrentReport().type === 'sighting');

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.petImage.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  nextStep() {
  const currentReport = this.wizardService.getCurrentReport();

  
  const pet: Pet = {
    name: this.petName(),
    species: this.petSpecies(),
    breed: this.petBreed(),
    description: this.petDescription(),
    gender: this.petGender(),
    size: this.petSize(),
    hasIdentification: this.hasIdentification(),
    imageUrl: this.petImage() || undefined,
  };
  this.wizardService.setPetData(pet);


  if (currentReport.type === 'sighting') {
    const sightingDetails: SightingDetails = {
      animalType: this.animalType(),
      hasIdCollar: this.hasIdCollar(),
    };
    this.wizardService.setSightingDetails(sightingDetails);
  }

  this.router.navigate(['/report/location']);
}

  previousStep() {
    this.router.navigate(['/report/type']);
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
