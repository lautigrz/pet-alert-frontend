import { Component, computed, inject, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { AdminStatsService } from '../../application/admin-stats.service';
import { AdminStats } from '../../domain/admin-stats.model';
import { ChartComponent } from './chart.component';

const ORANGE = '#E8842E';
const BLUE = '#12355B';
const SLATE = '#e2e8f0';

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [ChartComponent],
  host: { class: 'flex-1 min-h-0 flex flex-col overflow-hidden' },
  templateUrl: './admin-estadisticas.html',
})
export class AdminEstadisticasComponent {
  private readonly service = inject(AdminStatsService);

  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly barConfig = computed<ChartConfiguration | null>(() => {
    const stats = this.stats();
    if (!stats) return null;

    return {
      type: 'bar',
      data: {
        labels: stats.reportsByMonth.map((m) => this.monthLabel(m.month)),
        datasets: [
          { label: 'Perdidos', data: stats.reportsByMonth.map((m) => m.lost), backgroundColor: ORANGE, borderRadius: 4 },
          { label: 'Avistados', data: stats.reportsByMonth.map((m) => m.sighting), backgroundColor: BLUE, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', align: 'start', labels: { usePointStyle: true, pointStyle: 'circle' } } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };
  });

  readonly donutConfig = computed<ChartConfiguration | null>(() => {
    const stats = this.stats();
    if (!stats) return null;

    const { reunited, total } = stats.reunionRate;
    return {
      type: 'doughnut',
      data: {
        labels: ['Reunidos', 'Sin reunir'],
        datasets: [
          { data: [reunited, Math.max(total - reunited, 0)], backgroundColor: [ORANGE, SLATE], borderWidth: 0 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false } },
      },
    };
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.stats.set(await this.service.getStats());
    } catch {
      this.error.set('No pudimos cargar las estadísticas. Reintentá en unos segundos.');
    } finally {
      this.loading.set(false);
    }
  }

  private monthLabel(month: string): string {
    const index = Number(month.slice(5, 7)) - 1;
    return MONTH_LABELS[index] ?? month;
  }
}
