import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LostDetails, Reporte, SightingDetails } from '../../../domain/report-read.model';

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  host: { class: 'block' },
  templateUrl: './report-card.html',
})
export class ReportCardComponent {
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

  readonly nombre = computed(() => {
    const r = this.data();
    if (!r) return '';
    const name = (r.details as Partial<LostDetails>).name;
    return name?.trim() ? name : this.titulo();
  });

  readonly direccion = computed(() => {
    const address = this.data()?.location.address ?? '';
    if (!address) return 'Sin ubicación';
    return address.split(',').slice(0, 2).map((p) => p.trim()).join(', ');
  });

  readonly estadoLabel = computed(() => {
    const s = this.data()?.status;
    return s === 'ACTIVE' ? 'Activo' : 'Cerrado';
  });

  readonly estadoColor = computed(() => {
    const s = this.data()?.status;
    return s === 'ACTIVE' ? '#E8842E' : '#94A3B8';
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
