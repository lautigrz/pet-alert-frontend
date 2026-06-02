import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CreatePetRequest {
  name: string;
  animalType: 'DOG' | 'CAT';
  genderType: 'MALE' | 'FEMALE';
  sizeType: 'SMALL' | 'MEDIUM' | 'LARGE';
  color: string;
  hasIdCollar: boolean;
  breed: string;
  photos: File[];
}

export interface CreatePetResponse {
  publicId: string;
}

@Injectable({ providedIn: 'root' })
export class PetHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createPet(body: CreatePetRequest): Promise<CreatePetResponse> {
    const formData = new FormData();

    const petData = {
      name: body.name,
      animalType: body.animalType,
      genderType: body.genderType,
      sizeType: body.sizeType,
      color: body.color,
      hasIdCollar: body.hasIdCollar,
      breed: body.breed,
    };

    formData.append('data', JSON.stringify(petData));
    body.photos.forEach((photo) => formData.append('photos', photo));

    return firstValueFrom(
      this.http.post<CreatePetResponse>(`${this.baseUrl}/pets`, formData),
    );
  }
}
