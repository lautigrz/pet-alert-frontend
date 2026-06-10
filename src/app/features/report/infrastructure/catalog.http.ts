import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CatalogItem {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getColors(): Promise<CatalogItem[]> {
    return firstValueFrom(this.http.get<CatalogItem[]>(`${this.baseUrl}/catalog/colors`));
  }

  getBreeds(animalType: 'DOG' | 'CAT'): Promise<CatalogItem[]> {
    const params = new HttpParams().set('animalType', animalType);
    return firstValueFrom(
      this.http.get<CatalogItem[]>(`${this.baseUrl}/catalog/breeds`, { params }),
    );
  }
}
