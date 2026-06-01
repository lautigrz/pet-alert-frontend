import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReportWizardService } from '../../../application/report-wizard.service';
import { TokenStorage } from '../../../../auth/infrastructure/token.storage';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-lost-confirm-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lost-confirm-page.html',
  styleUrl: './lost-confirm-page.css',
})
export class LostConfirmPage {
  private router = inject(Router);
  private wizardService = inject(ReportWizardService);
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorage);  

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

    const tokens = this.tokenStorage.read();
    const payload = tokens ? JSON.parse(atob(tokens.accessToken.split('.')[1])) : {};
    const userId: number | undefined = payload.userId;
   // const userId: number = payload.userId ?? 6;

    try {
      const petPayload = {
        name: pet.name,
        userId,                                          
        animalType: this.mapSpecies(pet.species),        
        genderType: pet.gender === 'macho' ? 'male' : 'female',  
        sizeType: this.mapSize(pet.size),               
        color: '',
        hasIdCollar: pet.hasIdentification === 'si',
        breed: pet.breed || '',
      };

      const petRes: any = await this.http
        .post(`${environment.apiUrl}/pets`, petPayload)
        .toPromise();

      const reportPayload = {
        type: 'lost',                                  
        petId: petRes.publicId,
        occurredAt: location?.lastSeen ?? new Date(),
        location: {
          address: location?.address ?? '',
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
        },
        description: pet.description ?? '',
      };

      await this.http
        .post(`${environment.apiUrl}/reports`, reportPayload)
        .toPromise();

      this.success.set(true);
      this.wizardService.resetReport();
    } catch (err: any) {
      const msg = err?.error?.error ?? 'Ocurrió un error al crear el reporte.';
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
    return species === 'perro' ? 'dog' : 'cat';  
  }

  private mapSize(size: string): string {
    const map: Record<string, string> = {
      'pequeño': 'small',   
      'mediano': 'medium',
      'grande':  'large',
    };
    return map[size] ?? 'medium';
  }
}



