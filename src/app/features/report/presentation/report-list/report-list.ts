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

interface LocationSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

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

  readonly filtroTipo = signal<FiltroTipo>('TODOS');
  readonly filtroCercania = signal<FiltroCercania>('TODOS');
  readonly filtroMascota = signal<FiltroMascota>('TODOS');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');

  readonly busquedaDescripcion = signal('');
  readonly busquedaLocalidad = signal('');
  readonly locationSuggestions = signal<LocationSuggestion[]>([]);
  private descriptionSearchDebounce?: ReturnType<typeof setTimeout>;
  private locationSearchDebounce?: ReturnType<typeof setTimeout>;

  readonly ubicacion = signal<Coordenadas | null>(null);
  readonly ubicacionDenegada = signal(false);

  readonly mostrarFiltros = signal(false);

  readonly reportesVisibles = computed(() => {
    const localidad = this.normalizar(this.busquedaLocalidad());

    if (!localidad) {
      return this.reportes();
    }

    return this.reportes().filter((reporte) =>
      this.normalizar(reporte.location.address ?? '').includes(localidad),
    );
  });

  readonly sinResultados = computed(
    () => !this.cargando() && !this.error() && this.reportesVisibles().length === 0,
  );

  async ngOnInit(): Promise<void> {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'todos' || tab === 'recientes' || tab === 'cercanos' || tab === 'mis-reportes') {
      this.tab.set(tab);
    }
    await this.cargar();
  }

  async seleccionarTab(tab: Tab): Promise<void> {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    await this.cargar();
  }

  onDescriptionSearchInput(value: string): void {
    this.busquedaDescripcion.set(value);

    if (this.descriptionSearchDebounce !== undefined) {
      clearTimeout(this.descriptionSearchDebounce);
    }
    this.descriptionSearchDebounce = setTimeout(() => {
      this.descriptionSearchDebounce = undefined;
      void this.cargar();
    }, 350);
  }

  async limpiarBusquedaDescripcion(): Promise<void> {
    this.busquedaDescripcion.set('');

    if (this.descriptionSearchDebounce !== undefined) {
      clearTimeout(this.descriptionSearchDebounce);
      this.descriptionSearchDebounce = undefined;
    }

    await this.cargar();
  }
  limpiarBusquedaLocalidad(): void {
    this.busquedaLocalidad.set('');
    this.locationSuggestions.set([]);
  }

  onLocationSearchInput(value: string): void {
    this.busquedaLocalidad.set(value);
    if (this.locationSearchDebounce) clearTimeout(this.locationSearchDebounce);
    if (value.trim().length < 3) {
      this.locationSuggestions.set([]);
      return;
    }
    this.locationSearchDebounce = setTimeout(() => {
      void this.fetchLocationSuggestions();
    }, 350);
  }

  private async fetchLocationSuggestions(): Promise<void> {
    const query = this.busquedaLocalidad().trim();

    if (!query) {
      this.locationSuggestions.set([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      this.locationSuggestions.set(
        data.map((result: {
          display_name: string;
          lat: string;
          lon: string;
        }) => ({
          displayName: result.display_name,
          lat: Number.parseFloat(result.lat),
          lng: Number.parseFloat(result.lon),
        })),
      );
    } catch {
      this.locationSuggestions.set([]);
    }
  }

  selectLocationSuggestion(suggestion: LocationSuggestion): void {
    this.busquedaLocalidad.set(suggestion.displayName.split(',')[0]?.trim() ?? suggestion.displayName,);
    this.locationSuggestions.set([]);
  }

  async searchLocation(): Promise<void> {
    if (!this.locationSuggestions().length) {
      await this.fetchLocationSuggestions();
    }
    const first = this.locationSuggestions()[0];


    if (first) {
      this.selectLocationSuggestion(first);
    }
  }

  private pedirUbicacion(): Promise<Coordenadas | null> {
    const actual = this.ubicacion();
    if (actual) return Promise.resolve(actual);

    if (!navigator.geolocation) {
      this.ubicacionDenegada.set(true);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.ubicacion.set(coords);
          this.ubicacionDenegada.set(false);
          resolve(coords);
        },
        () => {
          this.ubicacionDenegada.set(true);
          resolve(null);
        },
      );
    });
  }

  async setFiltroTipo(valor: FiltroTipo): Promise<void> {
    this.filtroTipo.set(valor);
    await this.cargar();
  }

  async setFiltroCercania(valor: FiltroCercania): Promise<void> {
    this.filtroCercania.set(valor);
    await this.cargar();
  }

  async setFiltroMascota(valor: FiltroMascota): Promise<void> {
    this.filtroMascota.set(valor);
    await this.cargar();
  }

  async setFechaDesde(valor: string): Promise<void> {
    this.fechaDesde.set(valor);
    await this.cargar();
  }

  async setFechaHasta(valor: string): Promise<void> {
    this.fechaHasta.set(valor);
    await this.cargar();
  }

  async limpiarFechas(): Promise<void> {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    await this.cargar();
  }

  abrirFiltros(): void {
    this.mostrarFiltros.set(true);
  }

  cerrarFiltros(): void {
    this.mostrarFiltros.set(false);
  }

  async limpiarTodo(): Promise<void> {
    this.filtroTipo.set('TODOS');
    this.filtroCercania.set('TODOS');
    this.filtroMascota.set('TODOS');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.busquedaLocalidad.set('');
    this.locationSuggestions.set([]);
    await this.cargar();
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

  private async obtenerReportes(): Promise<Reporte[]> {
    const filtros = this.construirFiltros();

    if (this.tab() === 'recientes') {
      filtros.sort = 'recent';
    }

    const conRadio = this.filtroCercania() !== 'TODOS';

    if (this.tab() === 'cercanos' || conRadio) {
      const origen = await this.pedirUbicacion();
      if (!origen) return [];
      filtros.lat = origen.lat;
      filtros.lng = origen.lng;
      if (conRadio) {
        filtros.radiusKm = Number(this.filtroCercania());
      }
    }

    if (this.tab() === 'mis-reportes') {
      const misReportes = await this.reportesService.getMisReportes(filtros);
      return misReportes.filter((r) => r.status === 'ACTIVE');
    }

    filtros.status = 'ACTIVE';
    return this.reportesService.getGenerales(filtros);
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

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();
  }
}
