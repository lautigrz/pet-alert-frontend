import { Injectable, inject } from '@angular/core';
import { CatalogHttp } from '../infrastructure/catalog.http';
import { CAT_BREEDS, DOG_BREEDS, PET_COLORS } from '../domain/pet-options';

type Species = 'DOG' | 'CAT';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly catalogHttp = inject(CatalogHttp);
  private colors?: string[];
  private readonly breeds = new Map<Species, string[]>();

  async getColors(): Promise<string[]> {
    if (this.colors) return this.colors;
    try {
      const items = await this.catalogHttp.getColors();
      this.colors = items.length ? items.map((item) => item.name) : PET_COLORS;
    } catch {
      this.colors = PET_COLORS;
    }
    return this.colors;
  }

  async getBreeds(species: Species): Promise<string[]> {
    const cached = this.breeds.get(species);
    if (cached) return cached;

    let result: string[];
    try {
      const items = await this.catalogHttp.getBreeds(species);
      result = items.length ? items.map((item) => item.name) : this.fallbackBreeds(species);
    } catch {
      result = this.fallbackBreeds(species);
    }

    this.breeds.set(species, result);
    return result;
  }

  private fallbackBreeds(species: Species): string[] {
    return species === 'CAT' ? CAT_BREEDS : DOG_BREEDS;
  }
}
