import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LostDetails, Reporte, SightingDetails } from '../../../report/domain/report-read.model';

@Component({
  selector: 'app-home-report-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  host: { class: 'block' },
  templateUrl: './home-report-card.html',
})
export class HomeReportCardComponent {
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

  readonly imagen = computed(() => this.data()?.details.images?.[0]?.url ?? null);

  readonly nombre = computed(() => {
    const r = this.data();
    if (!r) return '';
    const name = (r.details as Partial<LostDetails>).name;
    if (name?.trim()) return name;
    const especie = this.especie((r.details as LostDetails | SightingDetails).animalType);
    if (r.type === 'LOST') return `${especie} perdido`;
    if (this.enTransito()) return `${especie} en tránsito`;
    return `${especie} avistado`;
  });

  readonly direccion = computed(() => {
    const address = this.data()?.location.address ?? '';
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return 'Sin ubicación';
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) return `${parts[1]} ${parts[0]}`;
    return parts.slice(0, 2).join(', ');
  });

  readonly tiempoRelativo = computed(() => {
    const r = this.data();
    if (!r) return '';
    return this.haceCuanto(r.createdAt);
  });

  readonly estadoLabel = computed(() => {
    const status = this.data()?.status;
    if (status === 'RESOLVED' || status === 'CLOSED') return 'Cerrado';
    return null;
  });

  private especie(tipo: string): string {
    const map: Record<string, string> = { DOG: 'Perro', CAT: 'Gato' };
    return map[tipo?.toUpperCase()] ?? tipo ?? '';
  }

  private haceCuanto(fecha: string): string {
    const date = new Date(fecha);
    const horas = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (horas < 1) return 'Hace instantes';
    if (horas < 24) return `Hace ${horas}hs`;
    return `Hace ${Math.floor(horas / 24)}d`;
  }
}
