import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportDetail } from '../../../infrastructure/report.http'; // ajustá el path según tu estructura


interface TimelineStep {
  label: string;
  date: string;
  dotClass: string;
}

@Component({
  selector: 'app-report-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-timeline.html',
})
export class ReportTimelineComponent {
  private readonly _report = signal<ReportDetail | null>(null);

  @Input({ required: true })
  set report(value: ReportDetail | null) {
    this._report.set(value);
  }
  get report(): ReportDetail | null {
    return this._report();
  }

  readonly eventLabel = computed(() => {
    const r = this._report();
    return r?.type === 'LOST' ? 'Mascota perdida' : 'Mascota avistada';
  });

  readonly isClosed = computed(() => {
    const r = this._report();
    return r?.status === 'RESOLVED' || r?.status === 'CLOSED';
  });

  /**
   * Construye los pasos a mostrar:
   * 1. Ocurrió (siempre)
   * 2. Reportado (solo si createdAt difiere de occurredAt)
   * 3a. Cerrado (si el reporte está RESOLVED/CLOSED) usando updatedAt
   * 3b. Editado (si está ACTIVE pero updatedAt difiere de createdAt)
   */
  readonly steps = computed<TimelineStep[]>(() => {
    const r = this._report();
    if (!r) return [];

    const steps: TimelineStep[] = [
      {
        label: this.eventLabel(),
        date: this.formatDate(r.occurredAt),
        dotClass: 'bg-[#E8842E]',
      },
    ];

    if (!this.isSameInstant(r.occurredAt, r.createdAt)) {
      steps.push({
        label: 'Reportado',
        date: this.formatDate(r.createdAt),
        dotClass: 'bg-[#1D6FA3]',
      });
    }

    if (this.isClosed()) {
      // El cierre siempre se muestra: es el dato más relevante del ciclo de vida.
      steps.push({
        label: r.status === 'RESOLVED' ? 'Resuelto' : 'Cerrado',
        date: this.formatDate(r.updatedAt),
        dotClass: 'bg-[#16a34a]',
      });
    } /*else if (!this.isSameInstant(r.createdAt, r.updatedAt)) {
      steps.push({
        label: 'Editado',
        date: this.formatDate(r.updatedAt),
        dotClass: 'bg-slate-400',
      });
    }*/

    return steps;
  });

  private isSameInstant(a: string, b: string): boolean {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    if (isNaN(da) || isNaN(db)) return false;
    // Tolerancia de 1 minuto: diferencias menores suelen ser ruido del propio guardado inicial.
    return Math.abs(da - db) < 60_000;
  }

  private formatDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
