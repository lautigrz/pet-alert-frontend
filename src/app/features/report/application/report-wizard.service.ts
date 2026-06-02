import { Injectable, signal } from '@angular/core';
import {
  PetReport,
  ReportType,
  Pet,
  Location,
  SightingDetails,
} from '../domain/report.model';

@Injectable({ providedIn: 'root' })
export class ReportWizardService {
  report = signal<PetReport>({
    type: (sessionStorage.getItem('report_type') as ReportType) || 'lost',
     pet: {
      species: 'perro',   
      name: '',
      breed: '',
      description: '',
      gender: 'macho',
      size: 'mediano',
      hasIdentification: 'no',
      imageUrl: undefined,
    },
    location: {
      latitude: 0,
      longitude: 0,
      address: '',
      city: '',
    },
    contact: {
      phone: '',
      email: '',
      userName: '',
    },
  });

  inTransit = signal(false);

  setType(type: ReportType) {
    this.report.update((r) => ({ ...r, type }));
    sessionStorage.setItem('report_type', type);
  }

  setInTransit(value: boolean) {
    this.inTransit.set(value);
  }

  setPetData(pet: Pet) {
    this.report.update((r) => ({ ...r, pet }));
  }

  setLocation(location: Location) {
    this.report.update((r) => ({ ...r, location }));
  }

  getCurrentReport() {
    return this.report();
  }

 resetReport() {
    this.inTransit.set(false);
    this.report.set({
      type: 'lost',
      pet: {
        species: 'perro',
        name: '',
        breed: '',
        description: '',
        gender: 'macho',
        size: 'mediano',
        hasIdentification: 'no',
        imageUrl: undefined,
      },
      location: {
        latitude: 0,
        longitude: 0,
        address: '',
        city: '',
      },
      contact: {
        phone: '',
        email: '',
        userName: '',
      },
    });
  }
  setSightingDetails(sightingDetails: SightingDetails) {
  this.report.update((r) => ({ ...r, sightingDetails }));
}
}
