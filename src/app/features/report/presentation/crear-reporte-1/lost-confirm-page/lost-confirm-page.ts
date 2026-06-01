import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { ReportService } from '../../../application/report.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-lost-confirm-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lost-confirm-page.html',
  styleUrl: './lost-confirm-page.css',
})
export class LostConfirmPage implements OnInit {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);
  private http = inject(HttpClient);
  private reportService = inject(ReportService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  success = signal(false);

  ngOnInit() {
    this.submitReport();
  }

  async submitReport() {
    this.isLoading.set(true);
    this.error.set(null);

    const report = this.wizardService.getCurrentReport();
    const pet = report.pet!;
    const location = report.location;

    try {
      const petFormData = new FormData();

      // Construir JSON de datos del pet
      const petData = {
        name: pet.name.trim(),
        animalType: this.mapSpecies(pet.species).toUpperCase(), // 'DOG' o 'CAT'
        genderType: pet.gender === 'macho' ? 'MALE' : 'FEMALE', // Enum: MALE/FEMALE
        sizeType: this.mapSize(pet.size).toUpperCase(), // 'SMALL', 'MEDIUM', 'LARGE'
        color: 'No especificado',
        hasIdCollar: pet.hasIdentification === 'si',
        breed: pet.breed?.trim() || '',
      };

      // Agregar datos como JSON stringificado en campo 'data'
      petFormData.append('data', JSON.stringify(petData));

      // Agregar foto del pet si existe
      if (pet.imageUrl) {
        const blob = await fetch(pet.imageUrl).then(r => r.blob());
        petFormData.append('photos', blob, 'pet-photo.jpg');
      } else {
        // El backend requiere obligatoriamente al menos una foto
        throw new Error('Se requiere una foto de la mascota');
      }

      const petRes = await this.http
        .post<{ message: string; publicId: string }>(`${environment.apiUrl}/pets`, petFormData)
        .toPromise();

      if (!petRes?.publicId) throw new Error('No pet ID returned');

      await this.reportService.submitLostReport({
        petId: petRes.publicId,
        occurredAt: (location?.lastSeen && location.lastSeen.toString() !== 'Invalid Date') ? location.lastSeen : new Date(),
        location: {
          address: location?.address ?? '',
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
          city: location?.city ?? '',
        },
        description: pet.description?.trim() ?? '',
      });

      this.success.set(true);
      this.wizardService.resetReport();
    } catch (err: any) {
      
      console.error('🔴 ERROR DETECTADO EN EL FLUJO DE PERDIDO:', err);

      const msg = err?.error?.error ?? err?.message ?? 'Ocurrió un error al crear el reporte.';
      this.error.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  retry() {
    this.router.navigate(['/report/lost-review']);
  }

  private mapSpecies(species: string): string {
    const clean = species?.toLowerCase()?.trim();
    return clean === 'perro' || clean === 'dog' ? 'dog' : 'cat';
  }

  private mapSize(size: string): string {
    const clean = size?.toLowerCase()?.trim() ?? '';
    const map: Record<string, string> = {
      'pequeño': 'small',
      'mediano': 'medium',
      'grande': 'large',
    };
    return map[clean] ?? 'medium';
  }
}