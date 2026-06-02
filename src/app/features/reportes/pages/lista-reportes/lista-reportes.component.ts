import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesService } from '../../application/reportes.service';
import {
  AnimalType,
  Reporte,
  ReporteFiltros,
  ReportType,
} from '../../domain/reporte.model';
import { NavbarComponent } from '../../../../shared/component/navbar/navbar.component';
import { CardReporteComponent } from '../../components/card-reporte/card-reporte.component';

type Tab = 'recientes' | 'cercanos' | 'mis-reportes';
type FiltroTipo = 'TODOS' | ReportType;
type FiltroMascota = 'TODOS' | AnimalType;
type FiltroFecha = 'TODOS' | 'HOY' | 'SEMANA';

@Component({
  selector: 'app-lista-reportes',
  standalone: true,
  imports: [CommonModule, NavbarComponent, CardReporteComponent],
  templateUrl: './lista-reportes.component.html',
  styleUrls: ['./lista-reportes.component.css'],
})
export class ListaReportesComponent {
  private readonly reportesService = inject(ReportesService);

  readonly tab = signal<Tab>('recientes');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly reportes = signal<Reporte[]>([]);

  // Filtros del sidebar
  readonly filtroTipo = signal<FiltroTipo>('TODOS');
  readonly filtroMascota = signal<FiltroMascota>('TODOS');
  readonly filtroFecha = signal<FiltroFecha>('TODOS');

  readonly sinResultados = computed(
    () => !this.cargando() && !this.error() && this.reportes().length === 0,
  );

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async seleccionarTab(tab: Tab): Promise<void> {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    await this.cargar();
  }

  async setFiltroTipo(valor: FiltroTipo): Promise<void> {
    this.filtroTipo.set(valor);
    await this.cargar();
  }

  async setFiltroMascota(valor: FiltroMascota): Promise<void> {
    this.filtroMascota.set(valor);
    await this.cargar();
  }

  async setFiltroFecha(valor: FiltroFecha): Promise<void> {
    this.filtroFecha.set(valor);
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const filtros = this.construirFiltros();
      const data =
        this.tab() === 'mis-reportes'
          ? await this.reportesService.getMisReportes(filtros)
          : await this.reportesService.getGenerales(filtros);

      this.reportes.set(data);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No se pudieron cargar los reportes',
      );
      this.reportes.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  private construirFiltros(): ReporteFiltros {
    const filtros: ReporteFiltros = {};

    if (this.filtroTipo() !== 'TODOS') filtros.reportType = this.filtroTipo() as ReportType;
    if (this.filtroMascota() !== 'TODOS') filtros.animalType = this.filtroMascota() as AnimalType;

    const rango = this.rangoFecha(this.filtroFecha());
    if (rango) {
      filtros.createdFrom = rango.from;
      filtros.createdTo = rango.to;
    }

    return filtros;
  }

  private rangoFecha(filtro: FiltroFecha): { from: string; to: string } | null {
    if (filtro === 'TODOS') return null;

    const hoy = new Date();
    const to = this.aISO(hoy);

    if (filtro === 'HOY') return { from: to, to };

    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - 7);
    return { from: this.aISO(desde), to };
  }

  private aISO(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }
}
