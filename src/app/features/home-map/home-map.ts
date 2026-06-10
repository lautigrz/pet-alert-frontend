import { Component, AfterViewInit, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportesService } from '../reportes/application/reportes.service';
import { Reporte, SightingDetails } from '../reportes/domain/reporte.model';
import { CardReporteComponent } from '../reportes/components/card-reporte/card-reporte.component';
import { ProfileService } from '../profile/application/profile.service';
import * as L from 'leaflet';

interface LocationSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [CardReporteComponent],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  templateUrl: './home-map.html',
})
export class HomeMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private lugaresLayer = L.layerGroup();
  private markersLayer = L.layerGroup();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportesService = inject(ReportesService);
  private readonly profileService = inject(ProfileService);
  readonly successReportId = signal<string | null>(null);

  readonly tipoFiltro = signal('todos');
  readonly cercaniaFiltro = signal('todos');
  readonly mascotaFiltro = signal('todos');
  readonly centrosFiltro = signal('todos');
  readonly searchTerm = signal('');
  readonly suggestions = signal<LocationSuggestion[]>([]);


  readonly reportes = signal<Reporte[]>([]);
  readonly reportesFiltrados = signal<Reporte[]>([]);
  readonly misReportes = signal<Reporte[]>([]);
  readonly reportesCercanos = signal<Reporte[]>([]);
  readonly totalMisReportes = signal(0);
  readonly lugares = signal<any[]>([]);
  

  private readonly DEFAULT_LOCATION = {
    lat: -34.603734,
    lng: -58.38157,
  };


  private userMarker?: L.Marker;
  private userLatLng?: L.LatLng;
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
        ${imageHtml}
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
  this.reportesService.getGenerales(),
  this.reportesService.getMisReportes(),
]);

      console.log('REPORTES', reportes);
      this.reportes.set(reportes);
      this.reportesFiltrados.set(reportes);
      this.dibujarMarcadores(reportes);
      this.totalMisReportes.set(misReportes.length);
      this.misReportes.set(misReportes.slice(0, 3));
      this.reportesCercanos.set(reportes.slice(0, 5));
    } catch (error) {
      console.error('Error cargando reportes', error);
    }
};

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

    L.marker(
      [lat, lng],
      {
        icon: this.buildPin(
          color,
          imageUrl,
          fallbackIcon
        ),
      }
    )
      .addTo(this.markersLayer)
      .bindPopup(
        this.buildPopup(reporte),
        {
          maxWidth: 270,
          minWidth: 240,
        }
      );

  });
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
        (reporte.details as any).animalType;

      return animalType === 'DOG';

    });

  }

 
if (this.mascotaFiltro() === 'gato') {

  filtrados = filtrados.filter(reporte => {

    const animalType =
      (reporte.details as any).animalType;

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
    this.router.navigate(['/detalle-reporte', reportId]);
  }

  closeSuccess(): void {
    this.successReportId.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);
    this.map.attributionControl.setPrefix(false);
    this.map.attributionControl.setPosition('bottomleft');
    this.map.zoomControl.setPosition('bottomright');

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

  this.lugares().forEach(lugar => {

    L.circleMarker(
      [lugar.lat, lugar.lng],
      {
        radius: 10,
        fillColor:
          this.centrosFiltro() === 'veterinarias'
            ? '#22c55e'
            : '#2563eb',
        color:
          this.centrosFiltro() === 'veterinarias'
            ? '#15803d'
            : '#1d4ed8',
        weight: 2,
        fillOpacity: 0.9
      }
    )
      .addTo(this.lugaresLayer)
      .bindPopup(lugar.nombre);

  });

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

  private getUserLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
        this.placeUserMarker();
        this.map.setView(this.userLatLng, 15);
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

  if (!this.userLatLng) return;

  const query = `
    [out:json];
    (
      node["amenity"="${tipo}"]
      (around:5000,
      ${this.userLatLng.lat},
      ${this.userLatLng.lng});
    );
    out;
  `;

  try {

    const response = await fetch(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        body: query
      }
    );

    const data = await response.json();
    console.log(
  data.elements.map((l: any) => ({
    nombre: l.tags?.name,
    lat: l.lat,
    lng: l.lon
  }))
);
    

    this.lugares.set(
      data.elements.map((l: any) => ({
        nombre:
          l.tags?.name ||
          (tipo === 'police'
            ? 'Comisaría'
            : 'Veterinaria'),
        lat: l.lat,
        lng: l.lon
      }))
    );

    this.lugares.set(
  data.elements.map((l: any) => ({
    nombre:
      l.tags?.name ||
      (tipo === 'police'
        ? 'Comisaría'
        : 'Veterinaria'),
    lat: l.lat,
    lng: l.lon
  }))
);

this.dibujarLugares();



  } catch (error) {

    console.error(error);

  }

}
 
async aplicarFiltroCentros(): Promise<void> {

  if (
    this.centrosFiltro() === 'veterinarias'
  ) {

    await this.buscarLugares(
      'veterinary'
    );

  }

  else if (
    this.centrosFiltro() === 'comisarias'
  ) {

    await this.buscarLugares(
      'police'
    );

  }
  else {

  this.lugares.set([]);

  this.lugaresLayer.clearLayers();

}

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

  private centerOnUser(): void {
    if (this.userLatLng) {
      this.map.setView(this.userLatLng, 16);
      return;
    }
    this.getUserLocation();
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
    const query = this.searchTerm().trim();
    if (!query) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      this.suggestions.set(
        data.map((r: { display_name: string; lat: string; lon: string }) => ({
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        })),
      );
    } catch {
      this.suggestions.set([]);
    }
  }

  selectSuggestion(suggestion: LocationSuggestion): void {
    this.searchTerm.set(suggestion.displayName);
    this.suggestions.set([]);
    this.map.setView([suggestion.lat, suggestion.lng], 15);
    this.markSearchResult(suggestion.lat, suggestion.lng);
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
  }

  private markSearchResult(lat: number, lng: number): void {
    const latlng = L.latLng(lat, lng);
    if (this.searchMarker) {
      this.searchMarker.setLatLng(latlng);
      return;
    }
    this.searchMarker = L.marker(latlng, {
      icon: this.buildPin('#64748b'),
      zIndexOffset: 1000,
    }).addTo(this.map);
  }

  private buildPopup(reporte: Reporte): string {
    const details = reporte.details as {
      images?: { url: string }[];
    };

    const imageUrl = details.images?.[0]?.url;

    const tipoTexto =
      reporte.type === 'LOST' ? 'Mascota perdida' : 'Mascota encontrada';

    const tipoColor =
      reporte.type === 'LOST' ? '#E8842E' : '#12355B';

    const fecha = reporte.occurredAt
      ? new Date(reporte.occurredAt).toLocaleDateString('es-AR')
      : 'No informada';

    const descripcion =
      reporte.description?.trim() || 'Sin descripción adicional';

    return `
    <div style="
      width:240px;
      font-family: Nunito, sans-serif;
      color:#12355B;
    ">
      ${imageUrl
        ? `
            <img
              src="${imageUrl}"
              alt="Foto del reporte"
              style="
                width:100%;
                height:130px;
                object-fit:contain;
                border-radius:14px;
                margin-bottom:10px;
              "
            />
          `
        : `
            <div style="
              width:100%;
              height:130px;
              border-radius:14px;
              margin-bottom:10px;
              background:#e2e8f0;
              display:flex;
              align-items:center;
              justify-content:center;
              color:#64748b;
              font-size:13px;
              font-weight:600;
            ">
              Sin foto
            </div>
          `
      }

      <div style="
        display:inline-flex;
        align-items:center;
        background:${tipoColor};
        color:white;
        font-size:12px;
        font-weight:700;
        padding:5px 9px;
        border-radius:8px;
        margin-bottom:10px;
      ">
        ${tipoTexto}
      </div>

      <div style="
        font-size:13px;
        line-height:1.5;
        color:#334155;
        margin-bottom:8px;
      ">
        ${descripcion}
      </div>

      <div style="
        font-size:13px;
        line-height:1.6;
      ">
        <div>
          <strong>Ubicación:</strong><br />
          <span style="color:#334155;">${reporte.location.address}</span>
        </div>

        <div style="margin-top:6px;">
          <strong>Fecha:</strong>
          <span style="color:#334155;">${fecha}</span>
        </div>
      </div>

      <a
  href="/detalle-reporte/${reporte.publicId}"
  style="
    display:block;
    text-align:center;
    text-decoration:none;
    width:100%;
    box-sizing:border-box;
    margin-top:12px;
    background:#12355B;
    color:white;
    border:none;
    border-radius:8px;
    padding:9px 12px;
    font-size:13px;
    font-weight:700;
    cursor:pointer;
    font-family: Nunito, sans-serif;
  "
>
  Ver detalle
</a>
    </div>
  `;
  }

  
}
