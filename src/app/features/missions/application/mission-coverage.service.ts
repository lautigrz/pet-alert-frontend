import { AuthService } from '../../auth/application/auth.service';

const VISITED_KEY = (missionId: string, userId: string) => `pet_alert_visited_${userId}_${missionId}`;
const BUFFER_KEY = (missionId: string, userId: string) => `pet_alert_buffer_${userId}_${missionId}`;
const LAST_SYNC_KEY = (missionId: string, userId: string) => `pet_alert_last_sync_${userId}_${missionId}`;

import { Injectable, inject, signal } from '@angular/core';
import * as ngeohash from 'ngeohash';
import { MissionCoverageHttp } from '../infrastructure/mission-coverage.http';

@Injectable({
  providedIn: 'root'
})
export class MissionCoverageService {
  private readonly coverageHttp = inject(MissionCoverageHttp);
  private readonly authService = inject(AuthService);

  readonly coveragePoints = signal<[number, number, number][]>([]);
  readonly visitedCount = signal<number>(0);
  readonly allCellsCount = signal<number>(0);
  readonly userLocation = signal<[number, number] | null>(null);

  private activeMissionId: string | null = null;
  private watchId: number | null = null;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastErrorCode: number | null = null;
  private lastUserId = '';

  private centerLat: number | null = null;
  private centerLng: number | null = null;
  private radiusMeters: number | null = null;

  private visitedCells = new Set<string>();
  private pendingBuffer: string[] = [];
  private allCellsSet = new Set<string>();
  private coveragePointsList: [number, number, number][] = [];
  private lastSyncTimestamp = '';
  private isSyncing = false;
  private isPolling = false;
  private isFirstPoll = true;

  startTracking(
    missionId: string,
    centerLat?: number,
    centerLng?: number,
    radiusMeters?: number,
    enableGPSWatch = false
  ): void {
    const userId = this.getUserId();

    if (this.activeMissionId === missionId && this.lastUserId === userId) {
      const isWatchActive = this.watchId !== null;
      if (isWatchActive !== enableGPSWatch) {
        if (enableGPSWatch && typeof window !== 'undefined' && navigator.geolocation) {
          this.startWatch(true);
        } else {
          if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
          }
          this.userLocation.set(null);
        }
      }
      return;
    }

    this.stopTracking();

    this.activeMissionId = missionId;
    this.lastUserId = userId;
    this.centerLat = centerLat !== undefined ? centerLat : null;
    this.centerLng = centerLng !== undefined ? centerLng : null;
    this.radiusMeters = radiusMeters !== undefined ? radiusMeters : null;

    const visited = localStorage.getItem(VISITED_KEY(missionId, userId));
    this.visitedCells = new Set(visited ? JSON.parse(visited) : []);
    this.visitedCount.set(this.visitedCells.size);


    const buffer = localStorage.getItem(BUFFER_KEY(missionId, userId));
    this.pendingBuffer = buffer ? JSON.parse(buffer) : [];


    const lastSync = localStorage.getItem(LAST_SYNC_KEY(missionId, userId));
    this.lastSyncTimestamp = lastSync || '';


    this.allCellsSet.clear();
    this.coveragePointsList = [];
    this.coveragePoints.set([]);
    this.isFirstPoll = true;

    if (this.visitedCells.size > 0) {
      this.processNewCells(Array.from(this.visitedCells));
    }


    if (enableGPSWatch && typeof window !== 'undefined' && navigator.geolocation) {
      this.startWatch(true);
    }


    this.syncIntervalId = setInterval(() => this.syncPendingBuffer(), 15000);


    this.pollIntervalId = setInterval(() => this.pollCoverage(), 17000);


    this.pollCoverage();
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(this.watchId);
      }
      this.watchId = null;
    }
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }

    this.activeMissionId = null;
    this.lastUserId = '';
    this.centerLat = null;
    this.centerLng = null;
    this.radiusMeters = null;
    this.visitedCells.clear();
    this.pendingBuffer = [];
    this.allCellsSet.clear();
    this.coveragePointsList = [];
    this.coveragePoints.set([]);
    this.visitedCount.set(0);
    this.allCellsCount.set(0);
    this.userLocation.set(null);
    this.lastSyncTimestamp = '';
    this.isSyncing = false;
    this.isPolling = false;
    this.isFirstPoll = true;
  }

  private handleNewPosition(position: GeolocationPosition): void {
    if (!this.activeMissionId) return;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    if (this.centerLat !== null && this.centerLng !== null && this.radiusMeters !== null) {
      const distance = this.getDistanceInMeters(lat, lng, this.centerLat, this.centerLng);
      if (distance > this.radiusMeters) {
        return;
      }
    }

    const cell = ngeohash.encode(lat, lng, 8);

    if (!this.visitedCells.has(cell)) {
      this.visitedCells.add(cell);
      this.pendingBuffer.push(cell);
      this.visitedCount.set(this.visitedCells.size);

      const userId = this.getUserId();
      localStorage.setItem(VISITED_KEY(this.activeMissionId, userId), JSON.stringify(Array.from(this.visitedCells)));
      localStorage.setItem(BUFFER_KEY(this.activeMissionId, userId), JSON.stringify(this.pendingBuffer));

      this.processNewCells([cell]);
    }
  }

  private syncPendingBuffer(): void {
    if (!this.activeMissionId || this.pendingBuffer.length === 0 || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    const cellsToSend = [...this.pendingBuffer];

    this.coverageHttp.postCoverage(this.activeMissionId, cellsToSend).subscribe({
      next: () => {

        this.pendingBuffer = this.pendingBuffer.filter(c => !cellsToSend.includes(c));
        const userId = this.getUserId();
        localStorage.setItem(BUFFER_KEY(this.activeMissionId!, userId), JSON.stringify(this.pendingBuffer));
        this.isSyncing = false;
      },
      error: (err) => {
        console.error('[CoverageService] Error syncing coverage buffer:', err);

        this.isSyncing = false;
      }
    });
  }

  private pollCoverage(): void {
    if (!this.activeMissionId || this.isPolling) {
      return;
    }

    this.isPolling = true;
    const since = this.isFirstPoll ? '' : this.lastSyncTimestamp;

    this.coverageHttp.getCoverage(this.activeMissionId, since).subscribe({
      next: (res) => {
        const newCells = res.cells || [];
        const newTimestamp = res.lastSyncTimestamp || res.timestamp;

        if (newTimestamp) {
          this.lastSyncTimestamp = newTimestamp;
          const userId = this.getUserId();
          localStorage.setItem(LAST_SYNC_KEY(this.activeMissionId!, userId), this.lastSyncTimestamp);
        }

        if (newCells.length > 0) {
          this.processNewCells(newCells);
        }
        this.isFirstPoll = false;
        this.isPolling = false;
      },
      error: (err) => {
        console.error('[CoverageService] Error polling coverage:', err);
        this.isPolling = false;
      }
    });
  }

  private processNewCells(cells: string[]): void {
    let updated = false;
    for (const cell of cells) {
      if (!this.allCellsSet.has(cell)) {
        this.allCellsSet.add(cell);
        try {
          const decoded = ngeohash.decode(cell);

          this.coveragePointsList.push([decoded.latitude, decoded.longitude, 1.0]);
          updated = true;
        } catch (err) {
          console.error(`[CoverageService] Error decoding geohash cell: ${cell}`, err);
        }
      }
    }

    if (updated) {
      this.coveragePoints.set([...this.coveragePointsList]);
      this.allCellsCount.set(this.allCellsSet.size);
    }
  }

  private getUserId(): string {
    try {
      return this.authService.getCurrentUserId() || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  getVisitedCount(): number {
    return this.visitedCells.size;
  }

  getAllCellsCount(): number {
    return this.allCellsSet.size;
  }

  private startWatch(highAccuracy: boolean): void {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastErrorCode = null;
        this.userLocation.set([position.coords.latitude, position.coords.longitude]);
        this.handleNewPosition(position);
      },
      (error) => {
        if (error.code !== this.lastErrorCode) {
          console.error('[CoverageService] watchPosition error:', error.code, error.message);
          this.lastErrorCode = error.code;
        }
        if (highAccuracy && (error.code === 2 || error.code === 3)) {
          this.startWatch(false);
        }
      },
      { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: 0 }
    );
  }

  private getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
