import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReportListService } from '../../application/report-list.service';
import {
  AnimalType,
  Reporte,
  ReporteFiltros,
  ReportType,
} from '../../domain/report-read.model';
import { ReportCardComponent } from '../components/report-card/report-card';

type Tab = 'todos' | 'recientes' | 'cercanos' | 'mis-reportes';
type FiltroTipo = 'TODOS' | ReportType;
type FiltroMascota = 'TODOS' | AnimalType;
type FiltroCercania = 'TODOS' | '5' | '10' | '20';

interface Coordenadas {
  lat: number;
  lng: number;
}

const REPORTS_PER_PAGE = 10;

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, ReportCardComponent],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  templateUrl: './report-list.html',
})
export class ReportListPage implements OnInit {
  private readonly reportesService = inject(ReportListService);
  private readonly route = inject(ActivatedRoute);

  readonly tab = signal<Tab>('todos');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly reportes = signal<Reporte[]>([]);

  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly showPagination = computed(() => this.totalPages() > 1);
  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  private generalReportsCache: Reporte[] | null = null;

  readonly filtroTipo = signal<FiltroTipo>('TODOS');
  readonly filtroCercania = signal<FiltroCercania>('TODOS');
  readonly filtroMascota = signal<FiltroMascota>('TODOS');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');

  readonly busquedaDescripcion = signal('');
  private descriptionSearchDebounce?: ReturnType<typeof setTimeout>;

  readonly ubicacion = signal<Coordenadas | null>(null);
  readonly locationDenied = signal(false);

  readonly showFilters = signal(false);

  readonly sinResultados = computed(
    () => !this.cargando() && !this.error() && this.reportes().length === 0,
  );

  async ngOnInit(): Promise<void> {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'todos' || tab === 'recientes' || tab === 'cercanos' || tab === 'mis-reportes') {
      this.tab.set(tab);
    }
    await this.reload();
  }

  async selectTab(tab: Tab): Promise<void> {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    await this.reload();
  }

  onDescriptionSearchInput(value: string): void {
    this.busquedaDescripcion.set(value);

    if (this.descriptionSearchDebounce !== undefined) {
      clearTimeout(this.descriptionSearchDebounce);
    }
    this.descriptionSearchDebounce = setTimeout(() => {
      this.descriptionSearchDebounce = undefined;
      void this.reload();
    }, 350);
  }

  async limpiarBusquedaDescripcion(): Promise<void> {
    this.busquedaDescripcion.set('');

    if (this.descriptionSearchDebounce !== undefined) {
      clearTimeout(this.descriptionSearchDebounce);
      this.descriptionSearchDebounce = undefined;
    }

    await this.reload();
  }
  private pedirUbicacion(): Promise<Coordenadas | null> {
    const actual = this.ubicacion();
    if (actual) return Promise.resolve(actual);

    if (!navigator.geolocation) {
      this.locationDenied.set(true);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.ubicacion.set(coords);
          this.locationDenied.set(false);
          resolve(coords);
        },
        () => {
          this.locationDenied.set(true);
          resolve(null);
        },
      );
    });
  }

  async setFiltroTipo(valor: FiltroTipo): Promise<void> {
    this.filtroTipo.set(valor);
    await this.reload();
  }

  async setFiltroCercania(valor: FiltroCercania): Promise<void> {
    this.filtroCercania.set(valor);
    await this.reload();
  }

  async setFiltroMascota(valor: FiltroMascota): Promise<void> {
    this.filtroMascota.set(valor);
    await this.reload();
  }

  async setFechaDesde(valor: string): Promise<void> {
    this.fechaDesde.set(valor);
    await this.reload();
  }

  async setFechaHasta(valor: string): Promise<void> {
    this.fechaHasta.set(valor);
    await this.reload();
  }

  async clearDates(): Promise<void> {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    await this.reload();
  }

  openFilters(): void {
    this.showFilters.set(true);
  }

  closeFilters(): void {
    this.showFilters.set(false);
  }

  async limpiarTodo(): Promise<void> {
    this.filtroTipo.set('TODOS');
    this.filtroCercania.set('TODOS');
    this.filtroMascota.set('TODOS');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    await this.reload();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      this.reportes.set(await this.obtenerReportes());
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No se pudieron cargar los reportes',
      );
      this.reportes.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  private async reload(): Promise<void> {
    this.generalReportsCache = null;
    this.page.set(1);
    await this.cargar();
  }

  async goToPage(page: number): Promise<void> {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    await this.cargar();
  }

  private async obtenerReportes(): Promise<Reporte[]> {
    const filtros = this.construirFiltros();

    if (this.tab() === 'recientes') {
      filtros.sort = 'recent';
    }

    const conRadio = this.filtroCercania() !== 'TODOS';

    if (this.tab() === 'cercanos' || conRadio) {
      const origen = await this.pedirUbicacion();
      if (!origen) {
        this.totalPages.set(1);
        return [];
      }
      filtros.lat = origen.lat;
      filtros.lng = origen.lng;
      if (conRadio) {
        filtros.radiusKm = Number(this.filtroCercania());
      }
    }

    if (this.tab() === 'mis-reportes') {
      const { data, pagination } = await this.reportesService.getPaginatedMyReports(
        filtros,
        this.page(),
        REPORTS_PER_PAGE,
      );
      this.totalPages.set(pagination.totalPages);
      return data;
    }

    filtros.status = 'ACTIVE';
    if (this.generalReportsCache === null) {
      this.generalReportsCache = await this.reportesService.getGenerals(filtros);
    }
    this.totalPages.set(Math.max(1, Math.ceil(this.generalReportsCache.length / REPORTS_PER_PAGE)));
    const start = (this.page() - 1) * REPORTS_PER_PAGE;
    return this.generalReportsCache.slice(start, start + REPORTS_PER_PAGE);
  }

  private construirFiltros(): ReporteFiltros {
    const filtros: ReporteFiltros = {};

    const tipo = this.filtroTipo();
    if (tipo === 'LOST' || tipo === 'SIGHTING') filtros.reportType = tipo;

    if (this.filtroMascota() !== 'TODOS') filtros.animalType = this.filtroMascota() as AnimalType;

    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    if (desde) filtros.createdFrom = desde;
    if (hasta) filtros.createdTo = hasta;

    const query = this.busquedaDescripcion().trim();
    if (query.length >= 2) filtros.q = query;

    return filtros;
  }
}
