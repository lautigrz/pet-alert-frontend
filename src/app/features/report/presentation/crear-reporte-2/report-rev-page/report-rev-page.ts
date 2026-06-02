import { Component, AfterViewInit, OnDestroy, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { WizardStepperComponent } from '../../../../../shared/component/wizard-stepper/wizard-stepper.component';
import { ReportWizardService } from '../../../application/report-wizard.service';

@Component({
  selector: 'app-report-rev-page',
  standalone: true,
  imports: [RouterLink, WizardStepperComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-rev-page.html',
})
export class ReportRevPage implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly wizard = inject(ReportWizardService);

  readonly report = this.wizard.report;
  readonly badgeLabel = computed(() =>
    this.report().type === 'lost'
      ? 'Mascota perdida'
      : this.report().sightingDetails?.isInTransit
        ? 'Mascota en tránsito'
        : 'Mascota avistada',
  );

  readonly badgeIcon = computed(() =>
    this.report().type === 'lost' ? 'Icono-mascota-perdida.png' : 'Icono-mascota-encontrada.png',
  );

  readonly slots = [0, 1, 2, 3];

  private map?: L.Map;
  private readonly months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngAfterViewInit(): void {
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

    setTimeout(() => this.map?.invalidateSize(), 300);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  formatDate(value?: Date): string {
    const date = value ? new Date(value) : null;
    if (!date || isNaN(date.getTime())) return 'Sin fecha';
    return `${this.pad(date.getDate())} ${this.months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatTime(value?: Date): string {
    const date = value ? new Date(value) : null;
    if (!date || isNaN(date.getTime())) return '';
    return `${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
  }

  shortAddress(full?: string): string {
    if (!full) return 'Sin dirección';
    const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return full;
    if (/^\d+$/.test(parts[0]) && parts.length > 1) return `${parts[1]} ${parts[0]}`;
    return parts[0];
  }

  editPet(): void {
    const lost = this.report().type === 'lost';
    this.router.navigate([lost ? '/report/lost-data' : '/report/data']);
  }

  editLocation(): void {
    this.router.navigate(['/report/location']);
  }

  previousStep(): void {
    this.router.navigate(['/report/location']);
  }

  finish(): void {
    const lost = this.report().type === 'lost';
    this.router.navigate([lost ? '/report/lost-confirm' : '/report/confirm']);
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  private buildPin(): L.DivIcon {
    const photo = this.report().pet?.imageUrls?.[0];
    const inner = photo
      ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : '';
    const html = `
      <div style="position:relative;width:44px;height:44px;">
        <div style="width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E8842E;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>
        <div style="position:absolute;top:5px;left:5px;width:34px;height:34px;border-radius:50%;overflow:hidden;border:2px solid #fff;background:#12355B;">${inner}</div>
      </div>`;
    return L.divIcon({ html, className: '', iconSize: [44, 44], iconAnchor: [22, 44] });
  }
}
