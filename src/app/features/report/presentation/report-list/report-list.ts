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
type FiltroFecha = 'TODOS' | 'HOY' | 'SEMANA';
type FiltroCercania = 'TODOS' | '5' | '10' | '20';

interface Coordenadas {
  lat: number;
  lng: number;
}

const DIAS_RECIENTES = 3;

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
  readonly filtroFecha = signal<FiltroFecha>('TODOS');

  readonly busqueda = signal('');

  readonly ubicacion = signal<Coordenadas | null>(null);
  readonly ubicacionDenegada = signal(false);

  readonly reportesVisibles = computed(() => {
    const termino = this.normalizar(this.busqueda());

    const filtrados = this.reportes().filter((r) => {
      if (termino && !this.normalizar(r.location.address ?? '').includes(termino)) {
        return false;
      }
      return true;
    });

    if (this.tab() === 'recientes') {
  const limite = Date.now() - DIAS_RECIENTES * 24 * 60 * 60 * 1000;
  return filtrados
    .filter((r) => new Date(r.createdAt).getTime() >= limite)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

    if (this.tab() !== 'cercanos') return filtrados;

    const origen = this.ubicacion();
    if (!origen) return [];

    const radio = this.filtroCercania() === 'TODOS' ? Infinity : Number(this.filtroCercania());

    return filtrados
      .map((r) => ({ r, dist: this.distanciaKm(origen, r) }))
      .filter((x) => x.dist <= radio)
      .sort((a, b) => a.dist - b.dist)
      .map((x) => x.r);
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
    if (this.tab() === 'cercanos') this.pedirUbicacion();
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

  setFiltroCercania(valor: FiltroCercania): void {
    this.filtroCercania.set(valor);
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

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();
  }
}
