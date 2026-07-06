import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, output, signal } from '@angular/core';
import * as L from 'leaflet';
import { LocationSuggestion, Place, PlaceType, PlacesService } from '../../../../core/services/places.service';
import { buildPlacePinIcon } from '../../../../core/utils/place-pin';

@Component({
  selector: 'app-meeting-point-modal',
  standalone: true,
  imports: [],
  templateUrl: './meeting-point-modal.html',
})
export class MeetingPointModalComponent implements AfterViewInit, OnDestroy {
  private readonly placesService = inject(PlacesService);

  @ViewChild('mapEl') mapEl!: ElementRef<HTMLElement>;

  readonly closed = output<void>();
  readonly placeSelected = output<Place>();

  readonly searchTerm = signal('');
  readonly suggestions = signal<LocationSuggestion[]>([]);
  readonly type = signal<PlaceType>('veterinary');
  readonly places = signal<Place[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private map!: L.Map;
  private readonly placesLayer = L.layerGroup();
  private centerMarker?: L.CircleMarker;
  private center = L.latLng(-34.603734, -58.38157);
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private placesRequestId = 0;
  private readonly RADIUS_METERS = 8000;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement).setView(this.center, 14);
    this.map.attributionControl.setPrefix(false);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
    this.placesLayer.addTo(this.map);
    this.drawCenter();
    setTimeout(() => this.map.invalidateSize(), 200);
    this.locateUser();
  }

  private locateUser(): void {
    if (!navigator.geolocation) {
      this.searchPlaces();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (this.searchTerm()) return;
        this.center = L.latLng(position.coords.latitude, position.coords.longitude);
        this.map.setView(this.center, 15);
        this.drawCenter();
        this.searchPlaces();
      },
      () => {
        this.searchPlaces();
      },
    );
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.map?.remove();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    if (value.trim().length < 3) {
      this.suggestions.set([]);
      return;
    }
    this.searchDebounce = setTimeout(async () => {
      this.suggestions.set(await this.placesService.geocode(value));
    }, 350);
  }

  selectSuggestion(suggestion: LocationSuggestion): void {
    this.searchTerm.set(suggestion.displayName);
    this.suggestions.set([]);
    this.center = L.latLng(suggestion.lat, suggestion.lng);
    this.map.setView(this.center, 15);
    this.drawCenter();
    this.searchPlaces();
  }

  selectType(type: PlaceType): void {
    if (this.type() === type) return;
    this.type.set(type);
    this.searchPlaces();
  }

  selectPlace(place: Place): void {
    this.placeSelected.emit(place);
  }

  close(): void {
    this.closed.emit();
  }

  private async searchPlaces(): Promise<void> {
    const requestId = ++this.placesRequestId;
    this.loading.set(true);
    this.error.set(null);

    try {
      const places = await this.placesService.searchPlaces(
        this.type(),
        this.center.lat,
        this.center.lng,
        this.RADIUS_METERS,
      );

      if (requestId !== this.placesRequestId) return;

      this.places.set(places);
      this.drawPlaces();

      if (places.length === 0) {
        this.error.set('No se encontraron centros en esta zona.');
      }
    } catch (error) {
      if (requestId !== this.placesRequestId) return;

      console.error('Error buscando centros', error);
      this.places.set([]);
      this.placesLayer.clearLayers();
      this.error.set('No se pudieron cargar los centros. Intentá nuevamente.');
    } finally {
      if (requestId === this.placesRequestId) this.loading.set(false);
    }
  }

  private drawPlaces(): void {
    this.placesLayer.clearLayers();

    const icon = buildPlacePinIcon(this.type());

    this.places().forEach((place) => {
      L.marker([place.lat, place.lng], { icon })
        .addTo(this.placesLayer)
        .bindPopup(`${place.name}<br>${place.distance?.toFixed(1)} km`);
    });
  }

  private drawCenter(): void {
    if (this.centerMarker) {
      this.centerMarker.setLatLng(this.center);
      return;
    }
    this.centerMarker = L.circleMarker(this.center, {
      radius: 7,
      fillColor: '#E8842E',
      color: '#c2410c',
      weight: 2,
      fillOpacity: 1,
    }).addTo(this.map);
  }
}
