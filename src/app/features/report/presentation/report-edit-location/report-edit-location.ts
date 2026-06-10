import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { ReportService } from '../../application/report.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { ReportDetail } from '../../infrastructure/report.http';

interface LocationSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-report-edit-location',
  standalone: true,
  imports: [],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-edit-location.html',
})
export class ReportEditLocationPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportService = inject(ReportService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly address = signal('');
  readonly date = signal('');
  readonly time = signal('');
  readonly latitude = signal(0);
  readonly longitude = signal(0);
  readonly searchTerm = signal('');
  readonly suggestions = signal<LocationSuggestion[]>([]);
  readonly maxDate: string;
  readonly hours = Array.from({ length: 24 }, (_, i) => this.pad(i));
  readonly minutes = Array.from({ length: 60 }, (_, i) => this.pad(i));
  readonly selectedHour = computed(() => this.time().split(':')[0] ?? '00');
  readonly selectedMinute = computed(() => this.time().split(':')[1] ?? '00');

  protected readonly report = signal<ReportDetail | null>(null);
  private publicId!: string;
  private map!: L.Map;
  private marker!: L.Marker;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private readonly defaultCenter: L.LatLngTuple = [-34.603734, -58.38157];

  constructor() {
    this.maxDate = this.toDateValue(new Date());
  }

  async ngOnInit(): Promise<void> {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    try {
      const r = await this.reportService.getReportByPublicId(this.publicId);
      this.report.set(r);
      this.prefill(r);
      this.loading.set(false);
      this.initMap();
    } catch (error) {
      this.serverError.set(
        error instanceof Error ? error.message : 'No se pudo cargar el reporte',
      );
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    if (!document.getElementById('edit-location-map')) return;
    const center: L.LatLngTuple = [this.latitude(), this.longitude()];
    this.map = L.map('edit-location-map').setView(center, 16);
    this.map.attributionControl.setPrefix(false);
    this.map.attributionControl.setPosition('bottomleft');
    this.map.zoomControl.setPosition('bottomright');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
    this.addFocusControl();

    this.marker = L.marker(center, { draggable: true, icon: this.buildPin() }).addTo(this.map);
    this.marker.on('dragend', () => {
      const { lat, lng } = this.marker.getLatLng();
      this.setLatLng(lat, lng);
      this.reverseGeocode(lat, lng);
    });
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker.setLatLng(e.latlng);
      this.setLatLng(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  locateMe(): void {
    navigator.geolocation?.getCurrentPosition((pos) =>
      this.applyLocation(pos.coords.latitude, pos.coords.longitude),
    );
  }

  private addFocusControl(): void {
    const control = new L.Control({ position: 'bottomright' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control focus-control');
      const link = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
      link.href = '#';
      link.title = 'Usar mi ubicación actual';
      link.setAttribute('role', 'button');
      link.innerHTML = '<img src="Focus-map.svg" alt="" />';
      L.DomEvent.on(link, 'click', L.DomEvent.stop).on(link, 'click', () => this.locateMe());
      return container;
    };
    control.addTo(this.map);
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
    this.applyLocation(suggestion.lat, suggestion.lng, suggestion.displayName);
  }

  async search(): Promise<void> {
    if (!this.suggestions().length) await this.fetchSuggestions();
    const first = this.suggestions()[0];
    if (first) this.selectSuggestion(first);
  }

  clearSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchTerm.set('');
    this.suggestions.set([]);
  }

  onDateInput(value: string): void {
    this.date.set(value);
    this.time.set(this.clampTime(this.time()));
  }

  setHour(hour: string): void {
    this.time.set(this.clampTime(`${hour}:${this.selectedMinute()}`));
  }

  setMinute(minute: string): void {
    this.time.set(this.clampTime(`${this.selectedHour()}:${minute}`));
  }

  isHourDisabled(hour: string): boolean {
    return this.date() === this.maxDate && hour > this.pad(new Date().getHours());
  }

  isMinuteDisabled(minute: string): boolean {
    if (this.date() !== this.maxDate) return false;
    const now = new Date();
    return this.selectedHour() === this.pad(now.getHours()) && minute > this.pad(now.getMinutes());
  }

  async guardar(): Promise<void> {
    const r = this.report();
    if (!r || !this.address().trim()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    try {
      await this.reportService.updateReport({
        publicId: this.publicId,
        description: r.description || undefined,
        occurredAt: new Date(`${this.date()}T${this.time()}`),
        location: {
          address: this.address(),
          latitude: this.latitude(),
          longitude: this.longitude(),
        },
        keepImageIds: (r.details.images ?? []).map((img) => this.extractCloudinaryId(img.url)),
        ...(r.type === 'SIGHTING'
          ? { sightingDetails: this.buildSightingDetails(r) }
          : { lostDetails: this.buildLostDetails(r) }),
      });

      this.toastService.success('Ubicación actualizada correctamente');
      this.router.navigate(['/reports', this.publicId]);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      this.submitting.set(false);
    }
  }

  cancelar(): void {
    this.router.navigate(['/reports', this.publicId]);
  }

  private prefill(r: ReportDetail): void {
    this.address.set(r.location.address ?? '');
    this.latitude.set(r.location.latitude);
    this.longitude.set(r.location.longitude);

    const occurred = r.occurredAt ? new Date(r.occurredAt) : null;
    if (occurred && !isNaN(occurred.getTime())) {
      this.date.set(this.toDateValue(occurred));
      this.time.set(this.toTimeValue(occurred));
    } else {
      const now = new Date();
      this.date.set(this.toDateValue(now));
      this.time.set(this.toTimeValue(now));
    }
  }

  private buildSightingDetails(r: ReportDetail) {
    return {
      petName: r.details.petName ?? r.details.name ?? undefined,
      animalType: r.details.animalType,
      genderType: r.details.genderType || null,
      sizeType: r.details.sizeType || null,
      breed: r.details.breed || undefined,
      color: r.details.color || undefined,
      hasIdCollar: r.details.hasIdCollar,
    };
  }

  private buildLostDetails(r: ReportDetail) {
    return {
      petPublicId: r.details.publicId!,
      name: r.details.name ?? null,
      animalType: r.details.animalType,
      genderType: r.details.genderType || null,
      sizeType: r.details.sizeType || null,
      breed: r.details.breed || undefined,
      color: r.details.color || undefined,
      hasIdCollar: r.details.hasIdCollar,
    };
  }

  private applyLocation(lat: number, lng: number, address?: string): void {
    this.map.setView([lat, lng], 16);
    this.marker.setLatLng([lat, lng]);
    this.setLatLng(lat, lng);
    if (address) {
      this.address.set(address);
    } else {
      this.reverseGeocode(lat, lng);
    }
  }

  private setLatLng(lat: number, lng: number): void {
    this.latitude.set(lat);
    this.longitude.set(lng);
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      if (data?.display_name) this.address.set(data.display_name);
    } catch {
      return;
    }
  }

  private clampTime(value: string): string {
    if (this.date() !== this.maxDate) return value;
    const now = this.toTimeValue(new Date());
    return value > now ? now : value;
  }

  private toDateValue(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

  private toTimeValue(d: Date): string {
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  private buildPin(): L.DivIcon {
    const r = this.report();
    const lost = r?.type === 'LOST';
    const color = lost ? '#E8842E' : '#12355B';
    const fallback = lost
      ? 'Icono-mascota-perdida.png'
      : r?.details.isInTransit
        ? 'Icono-avistamiento-transito.png'
        : 'Icono-avistamiento-sin-transito.png';
    const photo = r?.details.images?.[0]?.url;
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

  private extractCloudinaryId(url: string): string {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : url;
  }
}
