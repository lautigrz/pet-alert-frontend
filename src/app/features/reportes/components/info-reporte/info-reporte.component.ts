import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ReportDetail } from '../../../report/infrastructure/report.http';

@Component({
  selector: 'app-info-reporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-reporte.component.html',
  styleUrls: ['./info-reporte.component.css'],
})
export class InfoReporteComponent {
  report = input.required<ReportDetail>();

  esPerdida = computed(() => this.report().type === 'LOST');

  titulo = computed(() => {
    const report = this.report();
    return (
      report.details.name ||
      report.details.petName ||
      (this.esPerdida() ? 'Mascota perdida' : 'Avistamiento')
    );
  });

  statusText = computed(() => {
    const status = this.report().status;
    return status === 'ACTIVE' ? 'Activo' : status === 'RESOLVED' ? 'Resuelto' : status;
  });

  statusBadgeClass = computed(() => ({
    'status-badge': true,
    'status-badge--active': this.report().status === 'ACTIVE',
    'status-badge--resolved': this.report().status === 'RESOLVED',
  }));

  estado = computed(() => (this.esPerdida() ? 'Mascota perdida' : 'Mascota avistada'));

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
  ubicacion = computed(() => this.report().location.address || 'Sin ubicacion');

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
