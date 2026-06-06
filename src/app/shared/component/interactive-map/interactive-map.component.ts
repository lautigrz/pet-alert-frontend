import {
  Component,
  AfterViewInit,
  OnDestroy,
  input,
  output,
  signal,
} from '@angular/core';
import * as L from 'leaflet';

export interface MapLocation {
  address: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  templateUrl: './interactive-map.component.html',
  styleUrls: ['./interactive-map.component.css'],
})
export class InteractiveMapComponent implements AfterViewInit, OnDestroy {
  initialLocation = input<MapLocation | null>(null);
  pinImageUrl = input<string | null>(null);
  mapId = input<string>('interactive-map');

  locationChange = output<MapLocation>();

  readonly searchTerm = signal('');
  readonly address = signal('');

  private readonly defaultCenter: L.LatLngTuple = [-34.603734, -58.38157];
  private map!: L.Map;
  private marker!: L.Marker;

  ngAfterViewInit(): void {
    const initial = this.initialLocation();
    const hasInitial = initial && (initial.latitude !== 0 || initial.longitude !== 0);
    const center: L.LatLngTuple = hasInitial
      ? [initial!.latitude, initial!.longitude]
      : this.defaultCenter;

    if (hasInitial) {
      this.address.set(initial!.address);
    }

    this.map = L.map(this.mapId(), { zoomControl: true }).setView(center, hasInitial ? 16 : 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.marker = L.marker(center, { draggable: true, icon: this.buildPin() }).addTo(this.map);

    this.marker.on('dragend', () => {
      const { lat, lng } = this.marker.getLatLng();
      this.reverseGeocode(lat, lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker.setLatLng(e.latlng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    if (!hasInitial) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => this.applyLocation(pos.coords.latitude, pos.coords.longitude),
        () => this.reverseGeocode(this.defaultCenter[0], this.defaultCenter[1]),
      );
    } else {
      this.emit(initial!.latitude, initial!.longitude, initial!.address);
    }

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  locateMe(): void {
    navigator.geolocation?.getCurrentPosition((pos) =>
      this.applyLocation(pos.coords.latitude, pos.coords.longitude),
    );
  }

  async search(): Promise<void> {
    const query = this.searchTerm().trim();
    if (!query) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      if (!data.length) return;
      this.applyLocation(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
    } catch {
      return;
    }
  }

  private applyLocation(lat: number, lng: number, address?: string): void {
    this.map.setView([lat, lng], 16);
    this.marker.setLatLng([lat, lng]);
    if (address) {
      this.address.set(address);
      this.emit(lat, lng, address);
    } else {
      this.reverseGeocode(lat, lng);
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      const addr = data?.display_name ?? '';
      this.address.set(addr);
      this.emit(lat, lng, addr);
    } catch {
      return;
    }
  }

  private emit(lat: number, lng: number, address: string): void {
    this.locationChange.emit({ latitude: lat, longitude: lng, address });
  }

  private buildPin(): L.DivIcon {
    const photo = this.pinImageUrl();
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
