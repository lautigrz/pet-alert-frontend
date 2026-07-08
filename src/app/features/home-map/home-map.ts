import { Component, AfterViewInit, OnInit, NgZone, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportListService } from '../report/application/report-list.service';
import { AnimalType, Reporte, SightingDetails } from '../report/domain/report-read.model';
import { HomeReportCardComponent } from './components/home-report-card/home-report-card';
import { NotificationPrompt } from '../notifications/presentation/notification-prompt/notification-prompt';
import { NotificationService } from '../notifications/application/notification.service';
import { ProfileService } from '../profile/application/profile.service';
import * as L from 'leaflet';
import { PetIconComponent } from '../../shared/component/pet-icon/pet-icon.component';

import { InfoTooltipComponent } from '../../shared/component/info-tooltip/info-tooltip.component';
import { PlacesService, LocationSuggestion, Place } from '../../core/services/places.service';
import { buildPlacePinIcon } from '../../core/utils/place-pin';

const MUNDO: [number, number][] = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180],
];

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [HomeReportCardComponent, RouterLink, NotificationPrompt, PetIconComponent, InfoTooltipComponent],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  templateUrl: './home-map.html',
  styleUrl: './home-map.css'
})
export class HomeMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private lugaresLayer = L.layerGroup();
  private markersLayer = L.layerGroup();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportesService = inject(ReportListService);
  private readonly profileService = inject(ProfileService);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(NotificationService);
  private readonly placesService = inject(PlacesService);
  readonly successReportId = signal<string | null>(null);

  readonly notifBusy = this.notifications.busy;

  readonly canAskNotifications = computed(
    () => this.notifications.isSupported() && this.notifications.permission() === 'default' && !this.notifications.active(),
  );

  readonly tipoFiltro = signal('todos');
  readonly cercaniaFiltro = signal('todos');
  readonly mascotaFiltro = signal('todos');
  readonly centrosFiltro = signal('todos');
  readonly searchTerm = signal('');
  readonly suggestions = signal<LocationSuggestion[]>([]);
  readonly showFilters = signal(false);
  readonly selectedReport = signal<Reporte | null>(null);


  readonly reportes = signal<Reporte[]>([]);
  readonly reportesFiltrados = signal<Reporte[]>([]);
  readonly misReportes = signal<Reporte[]>([]);
  readonly reportesCercanos = signal<Reporte[]>([]);
  readonly reportesDestacados = signal<Reporte[]>([]);
  readonly totalMisReportes = signal(0);
  readonly totalCercanos = signal(0);
  readonly totalDestacados = signal(0);
  readonly badgeMisReportes = computed(() => this.formatBadge(this.totalMisReportes()));
  readonly badgeCercanos = computed(() => this.formatBadge(this.totalCercanos()));
  readonly badgeDestacados = computed(() => this.formatBadge(this.totalDestacados()));
  readonly lugares = signal<Place[]>([]);

  readonly centrosCargando = signal(false);
  readonly centrosError = signal<string | null>(null);

  private readonly lugaresCache = new Map<string, Place[]>();
  private readonly RADIO_MAX_KM = 20;
  private centrosRequestId = 0;


  private readonly DEFAULT_LOCATION = {
    lat: -34.603734,
    lng: -58.38157,
  };


  private userMarker?: L.Marker;
  private radarMask?: L.Polygon;

  readonly radioRadar = signal(5);
  private userLatLng?: L.LatLng;
  private searchLatLng?: L.LatLng;
  private searchMarker?: L.Marker;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private profilePhotoUrl =
    'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';

  private buildPin(color: string, imageUrl?: string, fallbackIcon?: string): L.DivIcon {
    const imageHtml = imageUrl
      ? `<img src="${imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : fallbackIcon
        ? `<img src="${fallbackIcon}" alt="" style="width:20px;height:20px;object-fit:contain;display:block;" />`
        : '';

    return this.pinShell(color, imageHtml);
  }

  private pinShell(color: string, innerHtml: string): L.DivIcon {
    const html = `
    <div style="position:relative;width:44px;height:44px;">
      <div style="
        width:44px;
        height:44px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        box-shadow:0 2px 6px rgba(0,0,0,.35);
      "></div>

      <div style="
        position:absolute;
        top:5px;
        left:5px;
        width:34px;
        height:34px;
        border-radius:50%;
        background:${color};
        overflow:hidden;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${innerHtml}
      </div>
    </div>
  `;

    return L.divIcon({
      html,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });
  }



  private fallbackIconFor(reporte: Reporte): string {
    if (reporte.type === 'LOST') return 'Icono-mascota-perdida.png';
    return (reporte.details as SightingDetails).isInTransit
      ? 'Icono-avistamiento-transito.png'
      : 'Icono-avistamiento-sin-transito.png';
  }

  private async cargarReportes(): Promise<void> {
    try {
      const [reportes, misReportes] = await Promise.all([
        this.reportesService.getGenerales({ status: 'ACTIVE' }),
        this.reportesService.getMisReportes(),
      ]);

      const misReportesActivos = misReportes.filter((r) => r.status === 'ACTIVE');
      this.reportes.set(reportes);
      this.aplicarFiltrosActuales();
      this.totalMisReportes.set(misReportesActivos.length);
      this.misReportes.set(misReportesActivos.slice(0, 3));
      this.totalCercanos.set(reportes.length);
      this.reportesCercanos.set(reportes.slice(0, 5));
      this.actualizarDestacados();
    } catch (error) {
      console.error('Error cargando reportes', error);
    }
  };

  private actualizarDestacados(): void {
    const destacados = this.reportes().filter((reporte) => reporte.featured);
    this.totalDestacados.set(destacados.length);
    this.reportesDestacados.set(this.ordenarPorCercania(destacados).slice(0, 3));
  }

  private ordenarPorCercania(reportes: Reporte[]): Reporte[] {
    const centro = this.userLatLng;
    if (!centro) return reportes;

    return [...reportes].sort(
      (a, b) =>
        this.calcularDistancia(centro.lat, centro.lng, a.location.latitude, a.location.longitude) -
        this.calcularDistancia(centro.lat, centro.lng, b.location.latitude, b.location.longitude),
    );
  }

  private aplicarFiltrosActuales(): void {
    if (this.userLatLng) {
      this.filtrarPorRadar();
      return;
    }
    this.mostrarTodos();
  }

  private mostrarTodos(): void {
    this.reportesFiltrados.set(this.reportes());
    this.dibujarMarcadores(this.reportes());
  }

  private formatBadge(n: number): string {
    return n > 10 ? '+10' : String(n);
  }

  private dibujarMarcadores(reportes: Reporte[]): void {

    this.markersLayer.clearLayers();

    reportes.forEach((reporte) => {

      const lat = reporte.location.latitude;
      const lng = reporte.location.longitude;

      const color =
        reporte.type === 'LOST'
          ? '#E8842E'
          : '#12355B';

      const fallbackIcon =
        this.fallbackIconFor(reporte);

      const imageUrl =
        reporte.details?.images?.[0]?.url;

      const marker = L.marker(
        [lat, lng],
        {
          icon: this.buildPin(
            color,
            imageUrl,
            fallbackIcon
          ),
        }
      ).addTo(this.markersLayer);

      marker.bindPopup(
        this.buildPopup(reporte),
        {
          className: 'report-popup',
          maxWidth: 300,
          minWidth: 300,
          closeButton: false,
          offset: [0, -8],
        }
      );

      marker.on('click', () => {
        if (this.esMobile()) {
          marker.closePopup();
          this.zone.run(() => this.selectedReport.set(reporte));
        }
      });

    });
  }

  private esMobile(): boolean {
    return window.innerWidth < 1024;
  }

  aplicarFiltros(): void {

    let filtrados = [...this.reportes()];


    if (this.tipoFiltro() === 'perdidos') {

      filtrados = filtrados.filter(
        reporte => reporte.type === 'LOST'
      );

    }


    if (this.tipoFiltro() === 'avistados') {

      filtrados = filtrados.filter(
        reporte => reporte.type === 'SIGHTING'
      );

    }


    if (this.mascotaFiltro() === 'perro') {

      filtrados = filtrados.filter(reporte => {
        const animalType =
          (reporte.details as { animalType?: AnimalType }).animalType;

        return animalType === 'DOG';
      });

    }


    if (this.mascotaFiltro() === 'gato') {

      filtrados = filtrados.filter(reporte => {
        const animalType =
          (reporte.details as { animalType?: AnimalType }).animalType;

        return animalType === 'CAT';
      });

    }


    if (
      this.cercaniaFiltro() !== 'todos' &&
      this.userLatLng
    ) {

      const distanciaMaxima =
        Number(
          this.cercaniaFiltro()
            .replace('km', '')
        );

      filtrados = filtrados.filter(
        reporte => {

          const distancia =
            this.calcularDistancia(
              this.userLatLng!.lat,
              this.userLatLng!.lng,
              reporte.location.latitude,
              reporte.location.longitude
            );

          return distancia <= distanciaMaxima;

        }
      );


    }

    this.reportesFiltrados.set(filtrados);

    this.dibujarMarcadores(filtrados);
  }

  async ngOnInit(): Promise<void> {
    
    const reportId = this.route.snapshot.queryParamMap.get('reporte');
    if (reportId) this.successReportId.set(reportId);

    try {
      const profile = await this.profileService.getProfile();
      this.profilePhotoUrl =
        profile.photoUrl ||
        'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';
    } catch (error) {
      console.error('Error cargando perfil', error);
    }
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  verReporte(): void {
    const reportId = this.successReportId();
    this.successReportId.set(null);
    this.router.navigate(['/reports', reportId]);
  }

  closeSuccess(): void {
    this.successReportId.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  async activarNotificaciones(): Promise<void> {
    await this.notifications.enable();
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);
    this.map.attributionControl.setPrefix(false);
    this.map.attributionControl.setPosition('bottomleft');
    this.map.zoomControl.setPosition('bottomright');
    this.map.on('click', () =>
      this.zone.run(() => this.selectedReport.set(null)),
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.lugaresLayer.addTo(this.map);
    this.markersLayer.addTo(this.map);
    this.addFocusControl();
    this.getUserLocation();
    this.cargarReportes();
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  private dibujarLugares(): void {
    this.lugaresLayer.clearLayers();
    const icon = buildPlacePinIcon(
      this.centrosFiltro() === 'veterinarias' ? 'veterinary' : 'police',
    );
    this.lugares().forEach(lugar => this.dibujarLugar(lugar, icon));
  }

  private dibujarLugar(lugar: Place, icon: L.DivIcon): void {
    L.marker([lugar.lat, lugar.lng], { icon })
      .addTo(this.lugaresLayer)
      .bindPopup(`${lugar.name}<br>${lugar.distance?.toFixed(1)} km`);
  }

  private addFocusControl(): void {
    const control = new L.Control({ position: 'bottomright' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control focus-control');
      const link = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
      link.href = '#';
      link.title = 'Centrar en mi ubicación';
      link.setAttribute('role', 'button');
      link.innerHTML = '<img src="Focus-map.svg" alt="" />';
      L.DomEvent.on(link, 'click', L.DomEvent.stop).on(link, 'click', () => this.centerOnUser());
      return container;
    };
    control.addTo(this.map);
  }

  private getUserLocation(reaplicarFiltros = false): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
        this.placeUserMarker();
        this.dibujarRadar();
        this.filtrarPorRadar();
        this.map.setView(this.userLatLng, 15);
        if (reaplicarFiltros && !this.searchLatLng) {
          this.aplicarFiltroCentros();
        }
        this.actualizarDestacados();
        setTimeout(() => this.map.invalidateSize(), 100);
      },
      () => {
        this.map.setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
    );
  }

  private calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

    return R * c;
  }

  private async buscarLugares(
    tipo: 'veterinary' | 'police'
  ): Promise<void> {
    const centro = this.getCentroBusqueda();
    const cacheKey = this.getCacheKey(tipo, centro);

    const lugaresCacheados = this.lugaresCache.get(cacheKey);

    if (lugaresCacheados) {
      this.showVisiblePlaces(lugaresCacheados);
      return;
    }

    const requestId = ++this.centrosRequestId;

    this.centrosCargando.set(true);
    this.centrosError.set(null);

    const radioBusqueda = this.RADIO_MAX_KM * 1000;

    try {
      const lugares = await this.placesService.searchPlaces(
        tipo,
        centro.lat,
        centro.lng,
        radioBusqueda,
      );

      if (requestId !== this.centrosRequestId) {
        return;
      }

      this.lugaresCache.set(cacheKey, lugares);

      this.showVisiblePlaces(lugares);
    } catch (error) {
      if (requestId !== this.centrosRequestId) {
        return;
      }

      console.error('Error buscando lugares cercanos', error);

      this.lugares.set([]);
      this.lugaresLayer.clearLayers();
      this.centrosError.set('No se pudieron cargar los centros cercanos. Intentá nuevamente.');
    } finally {
      if (requestId === this.centrosRequestId) {
        this.centrosCargando.set(false);
      }
    }
  }

  private showVisiblePlaces(completos: Place[]): void {
    const radio = this.radioRadar();
    const visibles = completos.filter((lugar) => (lugar.distance ?? 0) <= radio);

    this.lugares.set(visibles);
    this.dibujarLugares();

    if (completos.length === 0) {
      this.centrosError.set('No se encontraron centros cercanos en OpenStreetMap.');
    } else if (visibles.length === 0) {
      this.centrosError.set(`No hay centros dentro de ${radio} km. Ampliá la cercanía.`);
    } else {
      this.centrosError.set(null);
    }
  }

  async aplicarFiltroCentros(): Promise<void> {
    this.centrosError.set(null);

    if (this.centrosFiltro() === 'veterinarias') {
      await this.buscarLugares('veterinary');
      return;
    }

    if (this.centrosFiltro() === 'comisarias') {
      await this.buscarLugares('police');
      return;
    }

    this.centrosRequestId++;
    this.lugares.set([]);
    this.lugaresLayer.clearLayers();
    this.centrosCargando.set(false);
  }

  irALugar(
    lat: number,
    lng: number
  ): void {

    this.map.setView(
      [lat, lng],
      18
    );

  }

  private placeUserMarker(): void {
    if (!this.userLatLng) return;
    if (this.userMarker) {
      this.userMarker.setLatLng(this.userLatLng);
      return;
    }
    this.userMarker = L.marker(this.userLatLng, {
      icon: this.buildPin('#000000', this.profilePhotoUrl),
      zIndexOffset: 1000,
    }).addTo(this.map);
  }

  private dibujarRadar(): void {
    const centro = this.centroReferencia();
    if (!centro) return;
    const radioMetros = this.radioRadar() * 1000;
    this.actualizarMascaraRadar(centro, radioMetros);
  }

  private actualizarMascaraRadar(centro: L.LatLng, radioMetros: number): void {
    const anillos = [MUNDO, this.puntosCirculo(centro, radioMetros)];
    if (this.radarMask) {
      this.radarMask.setLatLngs(anillos);
      return;
    }
    this.radarMask = L.polygon(anillos, {
      stroke: false,
      fillColor: '#12355B',
      fillOpacity: 0.2,
      interactive: false,
    }).addTo(this.map);
  }

  private puntosCirculo(centro: L.LatLng, radioMetros: number): [number, number][] {
    const puntos: [number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      puntos.push(this.puntoDestino(centro, radioMetros, (i * 360) / 64));
    }
    return puntos;
  }

  private puntoDestino(centro: L.LatLng, radioMetros: number, gradosBearing: number): [number, number] {
    const radioTierra = 6371000;
    const delta = radioMetros / radioTierra;
    const theta = (gradosBearing * Math.PI) / 180;
    const lat1 = (centro.lat * Math.PI) / 180;
    const lng1 = (centro.lng * Math.PI) / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(delta) + Math.cos(lat1) * Math.sin(delta) * Math.cos(theta));
    const lng2 = lng1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(lat1), Math.cos(delta) - Math.sin(lat1) * Math.sin(lat2));
    return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
  }

  private centerOnUser(): void {
    if (this.userLatLng) {
      this.map.setView(this.userLatLng, 16);
      if (!this.searchLatLng) {
        this.dibujarRadar();
        this.filtrarPorRadar();
        this.aplicarFiltroCentros();
      }
      return;
    }
    this.getUserLocation(true);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    if (value.trim().length < 3) {
      this.suggestions.set([]);
      return;
    }
    this.searchDebounce = setTimeout(() => this.fetchSuggestions(), 350);
  }

  private async fetchSuggestions(): Promise<void> {
    this.suggestions.set(await this.placesService.geocode(this.searchTerm()));
  }

  private filtrarPorRadar(): void {

  const centro = this.centroReferencia();
  if (!centro) return;

  let filtrados = [...this.reportes()];

  // FILTRO TIPO

  if (this.tipoFiltro() === 'perdidos') {

    filtrados = filtrados.filter(
      reporte => reporte.type === 'LOST'
    );

  }

  if (this.tipoFiltro() === 'avistados') {

    filtrados = filtrados.filter(
      reporte => reporte.type === 'SIGHTING'
    );

  }

  // FILTRO MASCOTA

  if (this.mascotaFiltro() === 'perro') {

    filtrados = filtrados.filter(reporte => {
      const animalType =
        (reporte.details as { animalType?: AnimalType }).animalType;

      return animalType === 'DOG';
    });

  }

  if (this.mascotaFiltro() === 'gato') {

    filtrados = filtrados.filter(reporte => {
      const animalType =
        (reporte.details as { animalType?: AnimalType }).animalType;

      return animalType === 'CAT';
    });

  }

  // FILTRO RADAR

  const distanciaMaxima =
    this.radioRadar();

  filtrados = filtrados.filter(
    reporte => {

      const distancia =
        this.calcularDistancia(
          centro.lat,
          centro.lng,
          reporte.location.latitude,
          reporte.location.longitude
        );

      return distancia <= distanciaMaxima;

    }
  );

  this.reportesFiltrados.set(
    filtrados
  );

  this.dibujarMarcadores(
    filtrados
  );

}

  selectSuggestion(suggestion: LocationSuggestion): void {
    this.searchTerm.set(suggestion.displayName);
    this.suggestions.set([]);
    this.searchLatLng = L.latLng(suggestion.lat, suggestion.lng);
    this.map.setView([suggestion.lat, suggestion.lng], 15);
    this.markSearchResult(suggestion.lat, suggestion.lng);
    this.dibujarRadar();
    this.filtrarPorRadar();
    this.aplicarFiltroCentros();
  }

  async searchLocation(): Promise<void> {
    if (!this.suggestions().length) await this.fetchSuggestions();
    const first = this.suggestions()[0];
    if (first) this.selectSuggestion(first);
  }

  clearSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchTerm.set('');
    this.suggestions.set([]);
    this.searchMarker?.remove();
    this.searchMarker = undefined;
    this.searchLatLng = undefined;
    this.dibujarRadar();
    this.filtrarPorRadar();
    this.aplicarFiltroCentros();
  }

  openFilters(): void {
    this.showFilters.set(true);
  }

  closeFilters(): void {
    this.showFilters.set(false);
  }

  selectType(value: string): void {
    this.tipoFiltro.set(value);
      this.filtrarPorRadar();

  }

  seleccionarCercania(value: string): void {
    this.cercaniaFiltro.set(value);
    this.aplicarFiltros();
  }

  seleccionarMascota(value: string): void {
    this.mascotaFiltro.set(value);
    this.filtrarPorRadar();
  }

  seleccionarCentros(value: string): void {
    this.centrosFiltro.set(value);
    this.aplicarFiltroCentros();
  }

  cambiarRadar(event: Event): void {

  const value =
    Number(
      (event.target as HTMLInputElement)
      .value
    );

  this.radioRadar.set(value);

  this.dibujarRadar();

  this.filtrarPorRadar();

  this.reprogramarCentros();
}

  private markSearchResult(lat: number, lng: number): void {
    const latlng = L.latLng(lat, lng);
    if (this.searchMarker) {
      this.searchMarker.setLatLng(latlng);
      return;
    }
    this.searchMarker = L.marker(latlng, {
      icon: this.buildPin('#1D6FA3'),
      zIndexOffset: 1000,
    }).addTo(this.map);
  }

  private buildPopup(reporte: Reporte): string {
    const d = reporte.details as { images?: { url: string }[]; name?: string; animalType?: string; isInTransit?: boolean };
    const imageUrl = d.images?.[0]?.url;
    const esPerdida = reporte.type === 'LOST';
    const enTransito = !esPerdida && d.isInTransit === true;
    const badgeColor = esPerdida ? '#E8842E' : '#12355B';
    const badgeText = esPerdida ? 'Mascota perdida' : enTransito ? 'En tránsito' : 'Mascota avistada';
    const badgeIcon = esPerdida
      ? '<img src="Icono-mascota-perdida.png" alt="" style="width:14px;height:14px;display:block;" />'
      : enTransito
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';

    const orange = (paths: string) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8842E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">${paths}</svg>`;
    const pinSvg = orange('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>');
    const calSvg = orange('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>');
    const clockSvg = orange('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>');

    const imgHtml = imageUrl
      ? `<img src="${imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>';

    return `
    <div style="font-family:Nunito,sans-serif;color:#12355B;">
      <div style="position:relative;width:100%;height:160px;background:#e2e8f0;">
        ${imgHtml}
        <span style="position:absolute;top:12px;left:12px;display:inline-flex;align-items:center;gap:6px;background:${badgeColor};color:#fff;font-size:12px;font-weight:700;padding:5px 10px;border-radius:8px;">
          ${badgeIcon} ${badgeText}
        </span>
      </div>
      <div style="padding:14px 16px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:10px;">
          <span style="font-size:18px;font-weight:800;color:#12355B;line-height:1.2;">${this.nombrePopup(reporte, d.name)}</span>
          <span style="font-size:12px;color:#94a3b8;white-space:nowrap;">${this.tiempoPopup(reporte.createdAt)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#475569;margin-bottom:8px;">
          ${pinSvg}<span>${this.direccionCorta(reporte.location.address)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:16px;font-size:13px;color:#475569;margin-bottom:14px;">
          <span style="display:inline-flex;align-items:center;gap:6px;">${calSvg}${this.fechaPopup(reporte.occurredAt)}</span>
          <span style="display:inline-flex;align-items:center;gap:6px;">${clockSvg}${this.horaPopup(reporte.occurredAt)}</span>
        </div>
        <a href="/reports/${reporte.publicId}" style="display:block;text-align:center;text-decoration:none;background:#12355B;color:#fff;border-radius:10px;padding:11px;font-size:14px;font-weight:700;font-family:Nunito,sans-serif;">
          Ver detalle
        </a>
      </div>
    </div>
  `;
  }

  private nombrePopup(reporte: Reporte, name?: string): string {
    if (name?.trim()) return name;
    const tipo = (reporte.details as { animalType?: string }).animalType;
    const especie = tipo?.toUpperCase() === 'CAT' ? 'Gato' : 'Perro';
    if (reporte.type === 'LOST') return `${especie} perdido`;
    return (reporte.details as { isInTransit?: boolean }).isInTransit ? `${especie} en tránsito` : `${especie} avistado`;
  }

  private tiempoPopup(fecha: string): string {
    const horas = Math.floor((Date.now() - new Date(fecha).getTime()) / 3_600_000);
    if (horas < 1) return 'Hace instantes';
    if (horas < 24) return `Hace ${horas}hs`;
    return `Hace ${Math.floor(horas / 24)}d`;
  }

  private direccionCorta(address: string): string {
    const parts = (address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return 'Sin ubicación';
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) return `${parts[1]} ${parts[0]}`;
    return parts[0];
  }

  private fechaPopup(fecha: string): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 'Sin fecha';
    return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  private horaPopup(fecha: string): string {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} hs`;
  }

  private getCentroBusqueda(): L.LatLng {
    return this.searchLatLng ?? this.userLatLng ?? this.map.getCenter();
  }

  private getCacheKey(tipo: 'veterinary' | 'police', centro: L.LatLng): string {
    return `${tipo}:${centro.lat.toFixed(3)}:${centro.lng.toFixed(3)}`;
  }

  private centroReferencia(): L.LatLng | undefined {
    return this.searchLatLng ?? this.userLatLng;
  }

  private reprogramarCentros(): void {
    if (this.centrosFiltro() === 'todos') return;

    const tipo = this.centrosFiltro() === 'veterinarias' ? 'veterinary' : 'police';
    const cached = this.lugaresCache.get(this.getCacheKey(tipo, this.getCentroBusqueda()));

    if (cached) {
      this.showVisiblePlaces(cached);
      return;
    }

    this.aplicarFiltroCentros();
  }


}
