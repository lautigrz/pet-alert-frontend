import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ReportDetail } from '../../../infrastructure/report.http';

@Component({
  selector: 'app-report-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-info.html',
})
export class ReportInfoComponent {
  report = input.required<ReportDetail>();

  esPerdida = computed(() => this.report().type === 'LOST');

  tiempo = computed(() => {
    const date = new Date(this.report().createdAt);
    const horas = Math.floor((Date.now() - date.getTime()) / 3_600_000);
    if (horas < 1) return 'Hace instantes';
    if (horas < 24) return `Hace ${horas}hs`;
    return `Hace ${Math.floor(horas / 24)}d`;
  });

  estadoColor = computed(() => {
    const s = this.report().status;
    return s === 'ACTIVE' ? '#E8842E' : '#94A3B8';
  });

  titulo = computed(() => {
    const report = this.report();
    return (
      report.details.name ||
      report.details.petName ||
      (this.esPerdida() ? 'Mascota perdida' : (report.details.isInTransit ? 'En tránsito' : 'Avistamiento'))
    );
  });

  statusText = computed(() => {
    const status = this.report().status;
    return status === 'ACTIVE' ? 'Activo' : 'Cerrado';
  });

  statusBadgeClass = computed(() => ({
    'status-badge': true,
    'status-badge--active': this.report().status === 'ACTIVE',
    'status-badge--resolved': this.report().status === 'RESOLVED',
  }));

  estado = computed(() => {
    if (this.esPerdida()) return 'Mascota perdida';
    return this.report().details.isInTransit ? 'En tránsito' : 'Mascota avistada';
  });

  enTransito = computed(() => !this.esPerdida() && !!this.report().details.isInTransit);

  datos = computed(() => {
    const details = this.report().details;
    return [
      this.especie(details.animalType),
      this.genero(details.genderType),
      this.tamano(details.sizeType),
      details.breed,
      details.color,
    ]
      .filter(Boolean)
      .join(' · ');
  });

  collar = computed(() => (this.report().details.hasIdCollar ? 'Con collar' : 'Sin collar'));
  transito = computed(() => (this.report().details.isInTransit ? 'En transito' : null));
  descripcion = computed(() => this.report().description || 'Sin descripcion');
  ubicacion = computed(() => {
    const address = this.report().location.address;
    if (!address) return 'Sin ubicación';

    const partes = address.split(',').map(p => p.trim());
    return partes.slice(0, 3).join(', ');
  });

  private especie(value?: string): string {
    const map: Record<string, string> = { DOG: 'Perro', CAT: 'Gato' };
    return value ? (map[value] ?? value) : '';
  }

  private genero(value?: string): string {
    const map: Record<string, string> = { MALE: 'Macho', FEMALE: 'Hembra' };
    return value ? (map[value] ?? value) : '';
  }

  private tamano(value?: string): string {
    const map: Record<string, string> = { SMALL: 'Pequeno', MEDIUM: 'Mediano', LARGE: 'Grande' };
    return value ? (map[value] ?? value) : '';
  }
}
