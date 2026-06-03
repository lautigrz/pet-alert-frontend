import { Component, AfterViewInit, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportesService } from '../reportes/application/reportes.service';
import { Reporte } from '../reportes/domain/reporte.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  templateUrl: './home-map.html',
})
export class HomeMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportesService = inject(ReportesService);
  readonly successReportId = signal<string | null>(null);

  readonly tipoFiltro = signal('todos');
  readonly cercaniaFiltro = signal('todos');
  readonly mascotaFiltro = signal('todos');
  readonly centrosFiltro = signal('todos');

  readonly misReportes = [
    {
      nombre: 'Cari',
      hace: 'Hace 2hs',
      tipo: 'Mascota perdida',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
    },
  ];

  readonly reportesCercanos = [
    {
      nombre: 'Cari',
      hace: 'Hace 2hs',
      tipo: 'Mascota perdida',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
    },
    {
      nombre: 'Charles',
      hace: 'Hace 2hs',
      tipo: 'Mascota avistada',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
    },
    {
      nombre: 'Mandarina',
      hace: 'Hace 2hs',
      tipo: 'Mascota perdida',
      direccion: 'Bartolomé Mitre 2000',
      fecha: '01 Ene 2026',
      hora: '13hs',
    },
  ];

  private readonly DEFAULT_LOCATION = {
    lat: -34.603734,
    lng: -58.38157,
  };

  private buildPin(color: string): L.DivIcon {
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
        border:2px solid #fff;
        background:white;
      "></div>
    </div>
  `;

    return L.divIcon({
      html,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });
  }

  private async cargarReportes(): Promise<void> {
    try {
      const reportes: Reporte[] = await this.reportesService.getGenerales();

      console.log('REPORTES', reportes);

      reportes.forEach((reporte) => {
        const lat = reporte.location.latitude;
        const lng = reporte.location.longitude;

        const color = reporte.type === 'LOST' ? '#E8842E' : '#1D6FA3';

        L.marker([lat, lng], {
          icon: this.buildPin(color),
        }).addTo(this.map).bindPopup(`
        <strong>${reporte.type === 'LOST' ? 'Mascota perdida' : 'Mascota avistada'}</strong>
        <br>
        ${reporte.location.address}
      `);
      });
    } catch (error) {
      console.error('Error cargando reportes', error);
    }
  }
  ngOnInit(): void {
    const reportId = this.route.snapshot.queryParamMap.get('reporte');
    if (reportId) this.successReportId.set(reportId);
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  verReporte(): void {
    const reportId = this.successReportId();
    this.successReportId.set(null);
    this.router.navigate(['/detalle-reporte'], {
      queryParams: reportId ? { reporte: reportId } : {},
    });
  }

  closeSuccess(): void {
    this.successReportId.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.getUserLocation();
    this.cargarReportes();
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  private getUserLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.map.setView([lat, lng], 15);
       L.marker(
  [lat, lng],
  {
    icon: this.buildPin('#000000'),
  }
).addTo(this.map);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
      () => {
        this.map.setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
    );
  }
}
