import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { Pet } from '../../../domain/report.model';

@Component({
  selector: 'app-lost-data-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lost-data-page.html',
  styleUrl: './lost-data-page.css',
})
export class LostDataPage {
  private router = inject(Router);
  wizardService = inject(ReportWizardService);

  petName = signal('');
  petSpecies = signal<'perro' | 'gato'>('perro');
  petBreed = signal('');
  petDescription = signal('');
  petGender = signal<'macho' | 'hembra'>('macho');
  petSize = signal<'pequeño' | 'mediano' | 'grande'>('mediano');
  hasIdentification = signal<'si' | 'no'>('no');
  hasVaccination = signal<'si' | 'no'>('no');
  petImage = signal<string | null>(null);

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
    this.router.navigate(['/report/lost-location']);
  }

  previousStep() {
    this.router.navigate(['/report/type']);
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
