import { Component, AfterViewInit, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [],
  host: { class: 'flex flex-1 min-h-0' },
  templateUrl: './home-map.html',
})
export class HomeMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly successReportId = signal<string | null>(null);

  readonly tipoFiltro = signal('todos');
  readonly cercaniaFiltro = signal('todos');
  readonly mascotaFiltro = signal('todos');
  readonly centrosFiltro = signal('todos');

  readonly misReportes = [
    { nombre: 'Cari', hace: 'Hace 2hs', tipo: 'Mascota perdida', direccion: 'Bartolomé Mitre 2000', fecha: '01 Ene 2026', hora: '13hs' },
  ];

  readonly reportesCercanos = [
    { nombre: 'Cari', hace: 'Hace 2hs', tipo: 'Mascota perdida', direccion: 'Bartolomé Mitre 2000', fecha: '01 Ene 2026', hora: '13hs' },
    { nombre: 'Charles', hace: 'Hace 2hs', tipo: 'Mascota avistada', direccion: 'Bartolomé Mitre 2000', fecha: '01 Ene 2026', hora: '13hs' },
    { nombre: 'Mandarina', hace: 'Hace 2hs', tipo: 'Mascota perdida', direccion: 'Bartolomé Mitre 2000', fecha: '01 Ene 2026', hora: '13hs' },
  ];

  private readonly DEFAULT_LOCATION = {
    lat: -34.603734,
    lng: -58.38157,
  };

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
    this.router.navigate(['/detalle-reporte'], { queryParams: reportId ? { reporte: reportId } : {} });
  }

  closeSuccess(): void {
    this.successReportId.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  private initializeMap(): void {
    this.map = L.map('map').setView(
      [this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng],
      13,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.getUserLocation();

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
        L.marker([lat, lng]).addTo(this.map);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
      () => {
        this.map.setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
    );
  }
}
