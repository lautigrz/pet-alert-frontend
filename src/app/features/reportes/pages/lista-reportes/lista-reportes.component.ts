import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesService } from '../../application/reportes.service';
import {
  AnimalType,
  Reporte,
  ReporteFiltros,
  ReportType,
  SightingDetails,
} from '../../domain/reporte.model';
import { CardReporteComponent } from '../../components/card-reporte/card-reporte.component';

type Tab = 'todos' | 'recientes' | 'cercanos' | 'mis-reportes';
type FiltroTipo = 'TODOS' | ReportType | 'TRANSITO';
type FiltroMascota = 'TODOS' | AnimalType;
type FiltroFecha = 'TODOS' | 'HOY' | 'SEMANA';

interface Coordenadas {
  lat: number;
  lng: number;
}

const RADIO_CERCANIA_KM = 5;
const DIAS_RECIENTES = 3;

@Component({
  selector: 'app-lista-reportes',
  standalone: true,
  imports: [CommonModule, CardReporteComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './lista-reportes.component.html',
  styleUrls: ['./lista-reportes.component.css'],
})
export class ListaReportesComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);

  readonly tab = signal<Tab>('todos');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly reportes = signal<Reporte[]>([]);

  // Filtros del sidebar
  readonly filtroTipo = signal<FiltroTipo>('TODOS');
  readonly filtroMascota = signal<FiltroMascota>('TODOS');
  readonly filtroFecha = signal<FiltroFecha>('TODOS');

  readonly busqueda = signal('');

  readonly ubicacion = signal<Coordenadas | null>(null);
  readonly ubicacionDenegada = signal(false);

  readonly reportesVisibles = computed(() => {
    const termino = this.normalizar(this.busqueda());
    const soloTransito = this.filtroTipo() === 'TRANSITO';

    const filtrados = this.reportes().filter((r) => {
      if (termino && !this.normalizar(r.location.address ?? '').includes(termino)) {
        return false;
      }
      if (soloTransito && !this.esEnTransito(r)) {
        return false;
      }
      return true;
    });

    if (this.tab() === 'recientes') {
      const limite = Date.now() - DIAS_RECIENTES * 24 * 60 * 60 * 1000;
      return filtrados.filter((r) => new Date(r.createdAt).getTime() >= limite);
    }

    if (this.tab() !== 'cercanos') return filtrados;

    const origen = this.ubicacion();
    if (!origen) return [];

    return filtrados
      .map((r) => ({ r, dist: this.distanciaKm(origen, r) }))
      .filter((x) => x.dist <= RADIO_CERCANIA_KM)
      .sort((a, b) => a.dist - b.dist)
      .map((x) => x.r);
  });

  readonly sinResultados = computed(
    () => !this.cargando() && !this.error() && this.reportesVisibles().length === 0,
  );

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async seleccionarTab(tab: Tab): Promise<void> {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    await this.cargar();
    if (tab === 'cercanos') this.pedirUbicacion();
  }

  private pedirUbicacion(): void {
    if (this.ubicacion()) return;

    if (!navigator.geolocation) {
      this.ubicacionDenegada.set(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.ubicacion.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.ubicacionDenegada.set(false);
      },
      () => this.ubicacionDenegada.set(true),
    );
  }

  private distanciaKm(origen: Coordenadas, reporte: Reporte): number {
    const radioTierra = 6371;
    const dLat = this.aRad(reporte.location.latitude - origen.lat);
    const dLng = this.aRad(reporte.location.longitude - origen.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.aRad(origen.lat)) *
        Math.cos(this.aRad(reporte.location.latitude)) *
        Math.sin(dLng / 2) ** 2;
    return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private aRad(grados: number): number {
    return (grados * Math.PI) / 180;
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

    const tipo = this.filtroTipo();
    if (tipo === 'LOST' || tipo === 'SIGHTING') filtros.reportType = tipo;

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

  private esEnTransito(r: Reporte): boolean {
    if (r.type === 'LOST') return false;
    return (r.details as SightingDetails).isInTransit === true;
  }

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();
  }
}
