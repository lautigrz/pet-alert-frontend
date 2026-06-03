import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LostDetails, Reporte, SightingDetails } from '../../domain/reporte.model';

@Component({
  selector: 'app-card-reporte',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './card-reporte.component.html',
  styleUrls: ['./card-reporte.component.css'],
})
export class CardReporteComponent {
  @Input({ required: true }) set reporte(value: Reporte) {
    this._reporte.set(value);
  }

  private readonly _reporte = signal<Reporte | null>(null);

  readonly data = computed(() => this._reporte());

  readonly esPerdida = computed(() => this.data()?.type === 'LOST');

  readonly enTransito = computed(() => {
    const r = this.data();
    if (!r || r.type === 'LOST') return false;
    return (r.details as SightingDetails).isInTransit === true;
  });

  readonly imagen = computed(() => {
    const r = this.data();
    if (!r) return null;
    return r.details.images?.[0]?.url ?? null;
  });

  readonly titulo = computed(() => {
    const r = this.data();
    if (!r) return '';

    const especie = this.especie((r.details as LostDetails | SightingDetails).animalType);

    if (r.type === 'LOST') return `${especie} perdido`;
    if (this.enTransito()) return `${especie} en tránsito`;
    return `${especie} avistado`;
  });

  
  readonly atributos = computed(() => {
    const r = this.data();
    if (!r) return '';
    if (r.type === 'LOST') {
      const d = r.details as LostDetails;
      return [this.especie(d.animalType), this.genero(d.genderType), this.tamano(d.sizeType)]
        .filter(Boolean)
        .join(' · ');
    }
    const d = r.details as SightingDetails;
    return [this.especie(d.animalType), d.color].filter(Boolean).join(' · ');
  });

  readonly tiempoRelativo = computed(() => {
    const r = this.data();
    if (!r) return '';
    return this.haceCuanto(r.createdAt);
  });

  private especie(tipo: string): string {
    const map: Record<string, string> = { DOG: 'Perro', CAT: 'Gato' };
    return map[tipo?.toUpperCase()] ?? tipo ?? '';
  }

  private genero(tipo: string): string {
    const map: Record<string, string> = { MALE: 'Macho', FEMALE: 'Hembra' };
    return map[tipo?.toUpperCase()] ?? tipo ?? '';
  }

  private tamano(tipo: string): string {
    const map: Record<string, string> = { SMALL: 'Pequeño', MEDIUM: 'Mediano', LARGE: 'Grande' };
    return map[tipo?.toUpperCase()] ?? tipo ?? '';
  }

  private haceCuanto(fecha: string): string {
    const date = new Date(fecha);
    const diffMs = Date.now() - date.getTime();
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    if (horas < 1) return 'Hace instantes';
    if (horas < 24) return `Hace ${horas}hs`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  }
}
