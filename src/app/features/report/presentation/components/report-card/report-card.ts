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

    const nombre = (r.type === 'LOST'
      ? (r.details as LostDetails).name
      : (r.details as SightingDetails).petName
    )?.trim();
    if (nombre) return nombre;

    const especie = this.especie((r.details as LostDetails | SightingDetails).animalType);

    if (r.type === 'LOST') return `${especie} perdido`;
    if (this.enTransito()) return `${especie} en tránsito`;
    return `${especie} avistado`;
  });

  readonly direccion = computed(() => {
    const address = this.data()?.location.address ?? '';
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return 'Sin ubicación';
    const [calle, ...resto] =
      parts.length >= 2 && /^\d+$/.test(parts[0])
        ? [`${parts[1]} ${parts[0]}`, ...parts.slice(2)]
        : parts;
    const zonas: string[] = [];
    for (const zona of resto) {
      const previa = zonas[zonas.length - 1];
      if (previa && this.mismaZona(previa, zona)) {
        if (zona.length < previa.length) zonas[zonas.length - 1] = zona;
        continue;
      }
      zonas.push(zona);
    }
    return [calle, ...zonas].slice(0, 3).join(', ');
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

  private mismaZona(a: string, b: string): boolean {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    return x.includes(y) || y.includes(x);
  }

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
