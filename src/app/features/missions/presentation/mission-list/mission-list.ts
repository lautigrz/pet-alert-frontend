import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MissionService } from '../../application/mission.service';
import { MissionCardOutput, SearchAreaOutput } from '../../infrastructure/models/mission.model';
import { MissionCardComponent } from '../mission-card/mission-card';
import { AuthService } from '../../../auth/application/auth.service';
import { ReportListService } from '../../../report/application/report-list.service';

type MissionTab = 'all' | 'recent' | 'nearby' | 'mine';
type MineFilter = 'created' | 'joined';
type NearnessFilter = 'ALL' | '5' | '10' | '20';

interface Coordinates {
  lat: number;
  lng: number;
}

const MISSIONS_PER_PAGE = 10;

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [MissionCardComponent],
  host: { class: 'flex flex-1 min-h-0 overflow-hidden' },
  templateUrl: './mission-list.html',
})
export class MissionListPage implements OnInit {
  private readonly missionService = inject(MissionService);
  private readonly reportListService = inject(ReportListService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly tab = signal<MissionTab>('all');
  readonly mineFilter = signal<MineFilter>('created');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly publicList = signal<MissionCardOutput[]>([]);
  readonly createdMissions = signal<MissionCardOutput[]>([]);
  readonly joinedMissions = signal<MissionCardOutput[]>([]);

  readonly mineActiveList = computed(() =>
    this.mineFilter() === 'created' ? this.createdMissions() : this.joinedMissions(),
  );

  private readonly visibleList = computed(() =>
    this.tab() === 'mine' ? this.mineActiveList() : this.publicList(),
  );

  readonly page = signal(1);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleList().length / MISSIONS_PER_PAGE)),
  );
  readonly showPagination = computed(() => this.totalPages() > 1);
  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly missions = computed(() => {
    const start = (this.page() - 1) * MISSIONS_PER_PAGE;
    return this.visibleList().slice(start, start + MISSIONS_PER_PAGE);
  });

  readonly nearnessFilter = signal<NearnessFilter>('ALL');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly search = signal('');
  private searchDebounce?: ReturnType<typeof setTimeout>;

  readonly location = signal<Coordinates | null>(null);
  readonly locationDenied = signal(false);
  readonly showFilters = signal(false);

  private allMissionsCache: MissionCardOutput[] | null = null;

  readonly noResults = computed(
    () =>
      !this.loading() &&
      !this.error() &&
      this.tab() !== 'mine' &&
      this.publicList().length === 0,
  );

  async ngOnInit(): Promise<void> {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'all' || tab === 'recent' || tab === 'nearby' || tab === 'mine') {
      this.tab.set(tab);
    }
    await this.reload();
  }

  async selectTab(tab: MissionTab): Promise<void> {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    await this.reload();
  }

  setMineFilter(value: MineFilter): void {
    this.mineFilter.set(value);
    this.page.set(1);
  }

  onSearchInput(value: string): void {
    this.search.set(value);
    if (this.searchDebounce !== undefined) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.searchDebounce = undefined;
      void this.reload();
    }, 300);
  }

  async clearSearch(): Promise<void> {
    this.search.set('');
    if (this.searchDebounce !== undefined) {
      clearTimeout(this.searchDebounce);
      this.searchDebounce = undefined;
    }
    await this.reload();
  }

  async setNearness(value: NearnessFilter): Promise<void> {
    this.nearnessFilter.set(value);
    await this.reload();
  }

  async setDateFrom(value: string): Promise<void> {
    this.dateFrom.set(value);
    await this.reload();
  }

  async setDateTo(value: string): Promise<void> {
    this.dateTo.set(value);
    await this.reload();
  }

  async clearDates(): Promise<void> {
    this.dateFrom.set('');
    this.dateTo.set('');
    await this.reload();
  }

  openFilters(): void {
    this.showFilters.set(true);
  }

  closeFilters(): void {
    this.showFilters.set(false);
  }

  async clearAll(): Promise<void> {
    this.nearnessFilter.set('ALL');
    this.dateFrom.set('');
    this.dateTo.set('');
    await this.reload();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
  }

  private async reload(): Promise<void> {
    this.page.set(1);
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.tab() === 'mine') {
        await this.loadMine();
      } else {
        this.publicList.set(await this.loadPublic());
      }
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las misiones',
      );
      this.publicList.set([]);
      this.createdMissions.set([]);
      this.joinedMissions.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async ensureAllMissions(): Promise<MissionCardOutput[]> {
    if (this.allMissionsCache === null) {
      this.allMissionsCache = await firstValueFrom(this.missionService.getMissions());
    }
    return this.allMissionsCache;
  }

  private async loadPublic(): Promise<MissionCardOutput[]> {
    const all = await this.ensureAllMissions();
    let list = await this.applyNearness(
      this.applyFilters(all.filter((mission) => mission.status !== 'CLOSED')),
    );

    if (this.tab() === 'nearby') {
      const origin = await this.requestLocation();
      if (!origin) return [];
      list = this.sortByDistance(list, origin);
    }

    if (this.tab() === 'recent') {
      list = this.sortByRecent(list);
    }

    return list;
  }

  private async loadMine(): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.createdMissions.set([]);
      this.joinedMissions.set([]);
      return;
    }

    const all = await this.ensureAllMissions();

    const myReports = await this.reportListService.getUserReports(userId);
    const myReportIds = new Set(myReports.map((report) => report.publicId));
    const created = all.filter((mission) => myReportIds.has(mission.report.publicId));

    const joined = await firstValueFrom(this.missionService.getJoinedMissionsByUser(userId));

    this.createdMissions.set(await this.applyNearness(this.applyFilters(created)));
    this.joinedMissions.set(await this.applyNearness(this.applyFilters(joined)));
  }

  private async applyNearness(list: MissionCardOutput[]): Promise<MissionCardOutput[]> {
    if (this.nearnessFilter() === 'ALL') return list;

    const origin = await this.requestLocation();
    if (!origin) return [];

    const radius = Number(this.nearnessFilter());
    return list.filter((mission) => this.distanceKm(origin, mission.searchArea) <= radius);
  }

  private applyFilters(list: MissionCardOutput[]): MissionCardOutput[] {
    const term = this.search().trim().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo() ? `${this.dateTo()}T23:59:59.999Z` : '';

    return list.filter((mission) => {
      if (term) {
        const haystack = [
          mission.report.title,
          mission.report.petDetails?.name,
          mission.report.location.address,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      const created = new Date(mission.createdAt).toISOString();
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }

  private sortByRecent(list: MissionCardOutput[]): MissionCardOutput[] {
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  private sortByDistance(list: MissionCardOutput[], origin: Coordinates): MissionCardOutput[] {
    return [...list]
      .map((mission) => ({ mission, distance: this.distanceKm(origin, mission.searchArea) }))
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => entry.mission);
  }

  private distanceKm(origin: Coordinates, area: SearchAreaOutput): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(area.latitude - origin.lat);
    const dLng = this.toRadians(area.longitude - origin.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(origin.lat)) *
        Math.cos(this.toRadians(area.latitude)) *
        Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private requestLocation(): Promise<Coordinates | null> {
    const current = this.location();
    if (current) return Promise.resolve(current);

    if (!navigator.geolocation) {
      this.locationDenied.set(true);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          this.location.set(coords);
          this.locationDenied.set(false);
          resolve(coords);
        },
        () => {
          this.locationDenied.set(true);
          resolve(null);
        },
      );
    });
  }
}
