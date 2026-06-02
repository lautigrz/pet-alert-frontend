import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PetHttp, CreatePetResponse } from '../infrastructure/pet.http';

export interface CreatePetCommand {
  name: string;
  species: 'perro' | 'gato';
  gender: 'macho' | 'hembra';
  size: 'pequeño' | 'mediano' | 'grande';
  color: string;
  hasIdCollar: boolean;
  breed: string;
  photos: File[];
}

@Injectable({ providedIn: 'root' })
export class PetService {
  private readonly petHttp = inject(PetHttp);

  async createPet(command: CreatePetCommand): Promise<CreatePetResponse> {
    try {
      return await this.petHttp.createPet({
        name: command.name.trim(),
        animalType: command.species === 'gato' ? 'CAT' : 'DOG',
        genderType: command.gender === 'hembra' ? 'FEMALE' : 'MALE',
        sizeType: this.mapSize(command.size),
        color: command.color.trim(),
        hasIdCollar: command.hasIdCollar,
        breed: command.breed.trim(),
        photos: command.photos,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapSize(size: string): 'SMALL' | 'MEDIUM' | 'LARGE' {
    if (size === 'pequeño') return 'SMALL';
    if (size === 'grande') return 'LARGE';
    return 'MEDIUM';
  }

  private mapError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new Error('Error inesperado al crear la mascota');
    }
    if (error.status === 0) return new Error('Sin conexión con el servidor');
    return new Error(error.error?.error ?? 'No se pudo crear la mascota');
  }
}
