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
import { MissionService } from '../missions/application/mission.service';
import { firstValueFrom } from 'rxjs';

import { InfoTooltipComponent } from '../../shared/component/info-tooltip/info-tooltip.component';
import { PlacesService, LocationSuggestion, Place } from '../../core/services/places.service';
import { buildPlacePinIcon } from '../../core/utils/place-pin';

const MUNDO: [number, number][] = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180],
];


interface SelectedMission {
  publicId?: string;
  public_id?: string;
  status: string;
  createdAt: Date;
  searchArea?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  latitude?: number;
  longitude?: number;
  radius?: number;
  report: {
    publicId: string;
    photoUrl?: string | null;
    title?: string | null;
    status: string;
    petDetails?: {
      name?: string;
      photoUrl?: string | null;
    };
    lost_report_detail?: {
      pet?: {
        name?: string;
        petImages?: { photoUrl: string }[];
      };
    };
    reportImages?: { photoUrl: string }[];
    location?: {
      address?: string | null;
    };
    location_address?: string | null;
  };
}

type ReportTypeFilter = 'ALL' | 'LOST' | 'SIGHTING';
type PetTypeFilter = 'ALL' | 'DOG' | 'CAT';
type ProximityFilter = 'ALL' | '5km' | '10km' | '20km';
type CenterFilter = 'ALL' | 'VETERINARY' | 'POLICE';


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
  private placesLayer = L.layerGroup();
  private markersLayer = L.layerGroup();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportesService = inject(ReportListService);
  private readonly profileService = inject(ProfileService);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(NotificationService);
  private readonly placesService = inject(PlacesService);
  readonly successReportId = signal<string | null>(null);
  private readonly missionService = inject(MissionService);


  readonly notifBusy = this.notifications.busy;

  readonly canAskNotifications = computed(
    () => this.notifications.isSupported() && this.notifications.permission() === 'default' && !this.notifications.active(),
  );

  readonly filterType = signal<ReportTypeFilter>('ALL');
  readonly proximityFilter = signal<ProximityFilter>('ALL');
  readonly petFilter = signal<PetTypeFilter>('ALL');
  readonly centerFilter = signal<CenterFilter>('ALL');
  readonly searchTerm = signal('');
  readonly suggestions = signal<LocationSuggestion[]>([]);


  readonly missions = signal<SelectedMission[]>([]);
  readonly selectedMission = signal<SelectedMission | null>(null);

  readonly showFilters = signal(false);
  readonly selectedReport = signal<Reporte | null>(null);



  readonly reports = signal<Reporte[]>([]);
  readonly leakedReports = signal<Reporte[]>([]);
  readonly myReports = signal<Reporte[]>([]);
  readonly nearbyReports = signal<Reporte[]>([]);
  readonly featuredReports = signal<Reporte[]>([]);
  readonly totalMyReports = signal(0);
  readonly totalNearby = signal(0);
  readonly totalFeatured = signal(0);
  readonly badgeMyReports = computed(() => this.formatBadge(this.totalMyReports()));
  readonly nearbyBadges = computed(() => this.formatBadge(this.totalNearby()));
  readonly featuredBadges = computed(() => this.formatBadge(this.totalFeatured()));
  readonly places = signal<Place[]>([]);

  readonly loadingCenters = signal(false);
  readonly errorCenters = signal<string | null>(null);

  private readonly placesCache = new Map<string, Place[]>();
  private readonly RADIO_MAX_KM = 20;
  private centersRequestId = 0;


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

  private async loadReports(): Promise<void> {
    try {
      const [reports, myReports] = await Promise.all([
        this.reportesService.getGenerals({ status: 'ACTIVE' }),
        this.reportesService.getMyReports(),
      ]);

      const myActiveReports = myReports.filter((r) => r.status === 'ACTIVE');
      this.reports.set(reports);
      this.applyCurrentFilters();
      this.totalMyReports.set(myActiveReports.length);
      this.myReports.set(myActiveReports.slice(0, 3));
      this.totalNearby.set(reports.length);
      this.nearbyReports.set(reports.slice(0, 5));
      this.updateFeatured();
    } catch (error) {
      console.error('Error cargando reportes', error);
    }
  };

  private updateFeatured(): void {
    const highlights = this.reports().filter((report) => report.featured);
    this.totalFeatured.set(highlights.length);
    this.featuredReports.set(this.sortByProximity(highlights).slice(0, 3));
  }

  private sortByProximity(reports: Reporte[]): Reporte[] {
    const center = this.userLatLng;
    if (!center) return reports;

    return [...reports].sort(
      (a, b) =>
        this.calculateDistance(center.lat, center.lng, a.location.latitude, a.location.longitude) -
        this.calculateDistance(center.lat, center.lng, b.location.latitude, b.location.longitude),
    );
  }

  private applyCurrentFilters(): void {
    if (this.userLatLng) {
      this.filterByRadar();
      return;
    }
    this.showAll();
  }

  private showAll(): void {
    this.leakedReports.set(this.reports());
    this.drawMarkers(this.reports());
  }

  private formatBadge(n: number): string {
    return n > 10 ? '+10' : String(n);
  }

  private drawMarkers(reportes: Reporte[]): void {

    this.markersLayer.clearLayers();


    if (this.showMissions()) {
      return;
    }

    reportes.forEach((report) => {

      const lat = report.location.latitude;
      const lng = report.location.longitude;

      const color =
        report.type === 'LOST'
          ? '#E8842E'
          : '#12355B';

      const fallbackIcon =
        this.fallbackIconFor(report);

      const imageUrl =
        report.details?.images?.[0]?.url;

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
        this.buildPopup(report),
        {
          className: 'report-popup',
          maxWidth: 300,
          minWidth: 300,
          closeButton: false,
          offset: [0, -8],
        }
      );

      marker.on('click', () => {
        if (this.isMobile()) {
          marker.closePopup();
          this.zone.run(() => this.selectedReport.set(report));
        }
      });

    });
  }

  private isMobile(): boolean {
    return window.innerWidth < 1024;
  }

  applyFilters(): void {
    let filters = [...this.reports()];

    if (this.filterType() !== 'ALL') {
      filters = filters.filter((report) => report.type === this.filterType());
    }

    if (this.petFilter() !== 'ALL') {
      const selectedPet = this.petFilter();

      filters = filters.filter((report) => {
        const animalType = (report.details as { animalType?: AnimalType }).animalType;

        return animalType === selectedPet;
      });
    }

    if (this.proximityFilter() !== 'ALL' && this.userLatLng) {
      const maxDistance = Number(this.proximityFilter().replace('km', ''));

      filters = filters.filter((report) => {
        const distance = this.calculateDistance(
          this.userLatLng!.lat,
          this.userLatLng!.lng,
          report.location.latitude,
          report.location.longitude,
        );

        return distance <= maxDistance;
      });
    }



    this.missionCircles.forEach(c => this.map.removeLayer(c));
    this.missionMarkers.forEach(m => this.map.removeLayer(m));

    this.missionCircles = [];
    this.missionMarkers = [];


    this.leakedReports.set(filters);
    this.drawMarkers(filters);

  }

  async ngOnInit(): Promise<void> {

    const reportId = this.route.snapshot.queryParamMap.get('reporte');
    if (reportId) this.successReportId.set(reportId);

    try {
      const profile = await this.profileService.getProfile();
      this.profilePhotoUrl =
        profile.photoUrl ||
        'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';


      const navigation = this.router.getCurrentNavigation();

      if (navigation?.extras.state?.['missionCreated']) {

        console.log("Misión creada correctamente");
      }
    } catch (error) {
      console.error('Error cargando perfil', error);
    }


  }

  openMission(mission: SelectedMission): void {

    this.selectedMission.set(null);

    this.router.navigate(
      ['/missions', mission.publicId ?? mission.public_id],
      {
        state: {
          mission
        }
      }
    );

  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  viewReport(): void {
    const reportId = this.successReportId();
    this.successReportId.set(null);
    this.router.navigate(['/reports', reportId]);
  }

  closeSuccess(): void {
    this.successReportId.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  async turnOnNotifications(): Promise<void> {
    await this.notifications.enable();
  }

  private async initializeMap(): Promise<void> {
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


    this.placesLayer.addTo(this.map);
    this.markersLayer.addTo(this.map);
    this.addFocusControl();
    this.getUserLocation();
    this.loadReports();
    this.loadMissions();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }


  readonly showMissions = signal(false);

  toggleMissions(): void {

    this.showMissions.update(v => !v);

    if (this.showMissions()) {

      this.drawMissions(this.missions());
      this.markersLayer.clearLayers();

    } else {

      this.missionCircles.forEach(c => this.map.removeLayer(c));
      this.missionMarkers.forEach(m => this.map.removeLayer(m));

      this.missionCircles = [];
      this.missionMarkers = [];

      this.drawMarkers(this.leakedReports());
    }

  }

  private drawPlaces(): void {
    this.placesLayer.clearLayers();

    const icon = buildPlacePinIcon(
      this.centerFilter() === 'VETERINARY' ? 'veterinary' : 'police',
    );

    this.places().forEach((place) => this.drawPlace(place, icon));
  }

  private drawPlace(place: Place, icon: L.DivIcon): void {
    L.marker([place.lat, place.lng], { icon })
      .addTo(this.placesLayer)
      .bindPopup(`${place.name}<br>${place.distance?.toFixed(1)} km`);
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

  private getUserLocation(reapplyFilters = false): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
        this.placeUserMarker();
        this.drawRadar();
        this.filterByRadar();
        this.map.setView(this.userLatLng, 15);
        if (reapplyFilters && !this.searchLatLng) {
          this.applyFilterCenters();
        }
        this.updateFeatured();
        setTimeout(() => this.map.invalidateSize(), 100);
      },
      () => {
        this.map.setView([this.DEFAULT_LOCATION.lat, this.DEFAULT_LOCATION.lng], 13);
        setTimeout(() => this.map.invalidateSize(), 100);
      },
    );
  }

  private calculateDistance(
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

  private async loadMissions(): Promise<void> {
    try {

      const missions =
        await firstValueFrom(this.missionService.getMissions());

      this.missions.set(missions);

      if (this.showMissions()) {
        this.drawMissions(missions);
      }

    } catch (error) {

      console.error("Error loading missions", error);

    }

  }

  private missionCircles: L.Circle[] = [];
  private missionMarkers: L.Marker[] = [];

  private drawMissions(missions: SelectedMission[]): void {

    this.missionCircles.forEach(c => this.map.removeLayer(c));
    this.missionMarkers.forEach(m => this.map.removeLayer(m));

    this.missionCircles = [];
    this.missionMarkers = [];

    for (const mission of missions) {

      const report = mission.report;

      const pet = report.lost_report_detail?.pet;

      const image =
        report.photoUrl ??
        report.petDetails?.photoUrl ??
        pet?.petImages?.[0]?.photoUrl ??
        report.reportImages?.[0]?.photoUrl ??
        '';

      const lat = mission.searchArea?.latitude ?? mission.latitude;
      const lng = mission.searchArea?.longitude ?? mission.longitude;
      const radius = mission.searchArea?.radius ?? mission.radius ?? 1000;

      if (lat === undefined || lng === undefined) {
        continue;
      }

      const isLost =
        this.reports().find(r => r.publicId === report.publicId)?.type === 'LOST';

      const circle = L.circle(
        [lat, lng],
        {
          radius: radius,
          color: isLost ? '#E8842E' : '#12355B',
          fillColor: isLost ? '#E8842E' : '#1D6FA3',
          fillOpacity: 0.18,
          weight: 3
        }
      ).addTo(this.map);

      const marker = L.marker(
        [lat, lng],
        {
          icon: this.buildMissionIcon(image, isLost)
        }
      ).addTo(this.map);

      marker.on('click', () => {

        this.zone.run(() => {

          this.selectedReport.set(null);

          this.selectedMission.set(mission);

        });

      });
      this.missionCircles.push(circle);
      this.missionMarkers.push(marker);

    }

  }
  private buildMissionIcon(imageUrl?: string, isLost = false): L.DivIcon {

    const color = isLost ? '#E8842E' : '#12355B';
    const glow = isLost ? 'rgba(232,132,46,.45)' : 'rgba(18,53,91,.45)';

    return L.divIcon({

      html: imageUrl
        ? `
      <div style="
          width:52px;
          height:52px;
          border-radius:50%;
          overflow:hidden;
          border:4px solid white;
          box-shadow:0 0 10px ${glow};
      ">
          <img
              src="${imageUrl}"
              style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
              "
          />
      </div>
      `
        : `
      <div style="
          width:52px;
          height:52px;
          border-radius:50%;
          background:${color};
          border:4px solid white;
          display:flex;
          justify-content:center;
          align-items:center;
          font-size:24px;
      ">
          🐾
      </div>
      `,

      className: '',
      iconSize: [52, 52],
      iconAnchor: [26, 26]

    });

  }

  private async searchPlaces(
    type: 'veterinary' | 'police'
  ): Promise<void> {
    const center = this.getSearchCenter();
    const cacheKey = this.getCacheKey(type, center);

    const cachedPlaces = this.placesCache.get(cacheKey);

    if (cachedPlaces) {
      this.showVisiblePlaces(cachedPlaces);
      return;
    }

    const requestId = ++this.centersRequestId;

    this.loadingCenters.set(true);
    this.errorCenters.set(null);

    const searchRadius = this.RADIO_MAX_KM * 1000;

    try {
      const places = await this.placesService.searchPlaces(
        type,
        center.lat,
        center.lng,
        searchRadius,
      );

      if (requestId !== this.centersRequestId) {
        return;
      }

      this.placesCache.set(cacheKey, places);

      this.showVisiblePlaces(places);
    } catch (error) {
      if (requestId !== this.centersRequestId) {
        return;
      }

      console.error('Error buscando lugares cercanos', error);

      this.places.set([]);
      this.placesLayer.clearLayers();
      this.errorCenters.set('No se pudieron cargar los centros cercanos. Intentá nuevamente.');
    } finally {
      if (requestId === this.centersRequestId) {
        this.loadingCenters.set(false);
      }
    }
  }

  private showVisiblePlaces(complete: Place[]): void {
    const radio = this.radioRadar();
    const visibles = complete.filter((place) => (place.distance ?? 0) <= radio);

    this.places.set(visibles);
    this.drawPlaces();

    if (complete.length === 0) {
      this.errorCenters.set('No se encontraron centros cercanos en OpenStreetMap.');
    } else if (visibles.length === 0) {
      this.errorCenters.set(`No hay centros dentro de ${radio} km. Ampliá la cercanía.`);
    } else {
      this.errorCenters.set(null);
    }
  }

  async applyFilterCenters(): Promise<void> {
    this.errorCenters.set(null);

    if (this.centerFilter() === 'VETERINARY') {
      await this.searchPlaces('veterinary');
      return;
    }

    if (this.centerFilter() === 'POLICE') {
      await this.searchPlaces('police');
      return;
    }

    this.centersRequestId++;
    this.places.set([]);
    this.placesLayer.clearLayers();
    this.loadingCenters.set(false);
  }

  goToAPlace(
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

  private drawRadar(): void {
    const center = this.referenceCenter();
    if (!center) return;
    const radioMeters = this.radioRadar() * 1000;
    this.updateRadarMask(center, radioMeters);
  }

  private updateRadarMask(center: L.LatLng, radioMeters: number): void {
    const rings = [MUNDO, this.circlePoints(center, radioMeters)];
    if (this.radarMask) {
      this.radarMask.setLatLngs(rings);
      return;
    }
    this.radarMask = L.polygon(rings, {
      stroke: false,
      fillColor: '#12355B',
      fillOpacity: 0.2,
      interactive: false,
    }).addTo(this.map);
  }

  private circlePoints(center: L.LatLng, radioMeters: number): [number, number][] {
    const points: [number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      points.push(this.destinationPoint(center, radioMeters, (i * 360) / 64));
    }
    return points;
  }

  private destinationPoint(center: L.LatLng, radioMeter: number, degreesBearing: number): [number, number] {
    const earthRadio = 6371000;
    const delta = radioMeter / earthRadio;
    const theta = (degreesBearing * Math.PI) / 180;
    const lat1 = (center.lat * Math.PI) / 180;
    const lng1 = (center.lng * Math.PI) / 180;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(delta) + Math.cos(lat1) * Math.sin(delta) * Math.cos(theta));
    const lng2 = lng1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(lat1), Math.cos(delta) - Math.sin(lat1) * Math.sin(lat2));
    return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
  }

  private centerOnUser(): void {
    if (this.userLatLng) {
      this.map.setView(this.userLatLng, 16);
      if (!this.searchLatLng) {
        this.drawRadar();
        this.filterByRadar();
        this.applyFilterCenters();
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

  private filterByRadar(): void {
    const center = this.referenceCenter();

    if (!center) return;

    let leaked = [...this.reports()];

    if (this.filterType() !== 'ALL') {
      leaked = leaked.filter((report) => report.type === this.filterType());
    }

    if (this.petFilter() !== 'ALL') {
      const selectedPet = this.petFilter();

      leaked = leaked.filter((report) => {
        const animalType = (report.details as { animalType?: AnimalType }).animalType;

        return animalType === selectedPet;
      });
    }

    const maxDistance = this.radioRadar();

    leaked = leaked.filter((report) => {
      const distance = this.calculateDistance(
        center.lat,
        center.lng,
        report.location.latitude,
        report.location.longitude,
      );

      return distance <= maxDistance;
    });

    this.leakedReports.set(leaked);
    this.drawMarkers(leaked);
  }

  selectSuggestion(suggestion: LocationSuggestion): void {
    this.searchTerm.set(suggestion.displayName);
    this.suggestions.set([]);
    this.searchLatLng = L.latLng(suggestion.lat, suggestion.lng);
    this.map.setView([suggestion.lat, suggestion.lng], 15);
    this.markSearchResult(suggestion.lat, suggestion.lng);
    this.drawRadar();
    this.filterByRadar();
    this.centerFilter.set('ALL');
    this.applyFilterCenters();
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
    this.drawRadar();
    this.filterByRadar();
    this.centerFilter.set('ALL');
    this.applyFilterCenters();
  }

  openFilters(): void {
    this.showFilters.set(true);
  }

  closeFilters(): void {
    this.showFilters.set(false);
  }

  selectType(value: ReportTypeFilter): void {
    this.filterType.set(value);
    this.filterByRadar();
  }

  selectProximity(value: ProximityFilter): void {
    this.proximityFilter.set(value);
    this.applyFilters();
  }

  selectPet(value: PetTypeFilter): void {
    this.petFilter.set(value);
    this.filterByRadar();
  }

  selectCenters(value: CenterFilter): void {
    this.centerFilter.set(value);
    this.applyFilterCenters();
  }

  replaceRadar(event: Event): void {

    const value =
      Number(
        (event.target as HTMLInputElement)
          .value
      );

    this.radioRadar.set(value);
    this.drawRadar();
    this.filterByRadar();
    this.rescheduleCenters();
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
    const isLost = reporte.type === 'LOST';
    const inTransit = !isLost && d.isInTransit === true;
    const badgeColor = isLost ? '#E8842E' : '#12355B';
    const badgeText = isLost ? 'Mascota perdida' : inTransit ? 'En tránsito' : 'Mascota avistada';
    const badgeIcon = isLost
      ? '<img src="Icono-mascota-perdida.png" alt="" style="width:14px;height:14px;display:block;" />'
      : inTransit
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
          <span style="font-size:18px;font-weight:800;color:#12355B;line-height:1.2;">${this.namePopup(reporte, d.name)}</span>
          <span style="font-size:12px;color:#94a3b8;white-space:nowrap;">${this.timePopup(reporte.createdAt)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#475569;margin-bottom:8px;">
          ${pinSvg}<span>${this.shortAddress(reporte.location.address)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:16px;font-size:13px;color:#475569;margin-bottom:14px;">
          <span style="display:inline-flex;align-items:center;gap:6px;">${calSvg}${this.datePopup(reporte.occurredAt)}</span>
          <span style="display:inline-flex;align-items:center;gap:6px;">${clockSvg}${this.hourPopup(reporte.occurredAt)}</span>
        </div>
        <a href="/reports/${reporte.publicId}" style="display:block;text-align:center;text-decoration:none;background:#12355B;color:#fff;border-radius:10px;padding:11px;font-size:14px;font-weight:700;font-family:Nunito,sans-serif;">
          Ver detalle
        </a>
      </div>
    </div>
  `;
  }

  private namePopup(report: Reporte, name?: string): string {
    if (name?.trim()) return name;
    const type = (report.details as { animalType?: string }).animalType;
    const species = type?.toUpperCase() === 'CAT' ? 'Gato' : 'Perro';
    if (report.type === 'LOST') return `${species} perdido`;
    return (report.details as { isInTransit?: boolean }).isInTransit ? `${species} en tránsito` : `${species} avistado`;
  }

  private timePopup(fecha: string): string {
    const hours = Math.floor((Date.now() - new Date(fecha).getTime()) / 3_600_000);
    if (hours < 1) return 'Hace instantes';
    if (hours < 24) return `Hace ${hours}hs`;
    return `Hace ${Math.floor(hours / 24)}d`;
  }

  private shortAddress(address: string): string {
    const parts = (address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return 'Sin ubicación';
    if (parts.length >= 2 && /^\d+$/.test(parts[0])) return `${parts[1]} ${parts[0]}`;
    return parts[0];
  }

  private datePopup(fecha: string): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return 'Sin fecha';
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private hourPopup(fecha: string): string {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} hs`;
  }

  private getSearchCenter(): L.LatLng {
    return this.searchLatLng ?? this.userLatLng ?? this.map.getCenter();
  }

  private getCacheKey(tipo: 'veterinary' | 'police', center: L.LatLng): string {
    return `${tipo}:${center.lat.toFixed(3)}:${center.lng.toFixed(3)}`;
  }

  private referenceCenter(): L.LatLng | undefined {
    return this.searchLatLng ?? this.userLatLng;
  }

  private rescheduleCenters(): void {
    if (this.centerFilter() === 'ALL') return;

    const type = this.centerFilter() === 'VETERINARY' ? 'veterinary' : 'police';

    const cached = this.placesCache.get(
      this.getCacheKey(type, this.getSearchCenter()),
    );

    if (cached) {
      this.showVisiblePlaces(cached);
      return;
    }

    this.applyFilterCenters();
  }


}
