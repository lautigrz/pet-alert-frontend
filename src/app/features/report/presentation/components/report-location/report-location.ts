import { AfterViewInit, Component, computed, input, output, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReportDetail } from '../../../infrastructure/report.http';
import * as L from 'leaflet';

@Component({
  selector: 'app-report-location',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './report-location.html',
})
export class ReportLocationComponent implements AfterViewInit, OnDestroy {
  report = input.required<ReportDetail>();
  esPropio = input(false);
  editar = output<void>();

  direccion = computed(() => {
    const address = this.report().location.address;
    if (!address) return 'Sin ubicación';

    const partes = address.split(',').map(p => p.trim());
    return partes.slice(0, 3).join(', ');
  });

  
  imagenMascota = computed(() => this.report().details.images[0]?.url ?? null);
  private map?: L.Map;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const container = document.getElementById('report-review-map');
    if (!container) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (container.offsetWidth > 0 && !this.map) {
        this.initMap();
        this.resizeObserver?.disconnect();
      }
    });

    this.resizeObserver.observe(container);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private initMap(): void {
    const location = this.report().location;
    if (!location) return;
    this.map = L.map('report-review-map', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([location.latitude, location.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    L.marker([location.latitude, location.longitude], { icon: this.buildPin(), interactive: false }).addTo(this.map);

    this.map.invalidateSize();
  }
  private buildPin(): L.DivIcon {
    const r = this.report();
    const lost = r.type === 'LOST';
    const color = lost ? '#E8842E' : '#12355B';
    const fallback = lost
      ? 'Icono-mascota-perdida.png'
      : r.details.isInTransit
        ? 'Icono-avistamiento-transito.png'
        : 'Icono-avistamiento-sin-transito.png';
    const photo = r.details.images[0]?.url;
    const inner = photo
      ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : `<img src="${fallback}" style="width:20px;height:20px;object-fit:contain;display:block;" />`;
    const html = `
        <div style="position:relative;width:44px;height:44px;">
          <div style="width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>
          <div style="position:absolute;top:5px;left:5px;width:34px;height:34px;border-radius:50%;overflow:hidden;background:${color};display:flex;align-items:center;justify-content:center;">${inner}</div>
        </div>`;
    return L.divIcon({ html, className: '', iconSize: [44, 44], iconAnchor: [22, 44] });
  }
}
