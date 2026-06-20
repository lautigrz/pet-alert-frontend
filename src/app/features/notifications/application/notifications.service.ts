import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { SocketService } from '../../../core/services/socket.service';
import { TokenStorage } from '../../auth/infrastructure/token.storage';
import { NotificationsHttp } from '../infrastructure/notifications.http';
import { MATCH_EVENT, MatchNotification, NotificacionCoincidencia } from '../domain/match-notification';

const STORAGE_PREFIX = 'petfinder.matchNotifications';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly socketService = inject(SocketService);
  private readonly notificationsHttp = inject(NotificationsHttp);
  private readonly tokenStorage = inject(TokenStorage);

  private readonly _notificaciones = signal<NotificacionCoincidencia[]>(this.leerStorage());
  readonly notificaciones = this._notificaciones.asReadonly();
  readonly noVistas = computed(() => this._notificaciones().filter((n) => !n.vista).length);

  private subscription: Subscription | null = null;
  private cargado = false;

  escuchar(): void {
    if (this.subscription) return;
    this.subscription = this.socketService
      .on<MatchNotification>(MATCH_EVENT)
      .subscribe((payload) => this.agregar(payload));
  }

  async cargar(): Promise<void> {
    if (this.cargado) return;
    this.cargado = true;
    this._notificaciones.set(this.leerStorage());
    try {
      const remotas = await this.notificationsHttp.getMine();
      this.fusionar(remotas);
    } catch {
      this.cargado = false;
    }
  }

  marcarVista(matchPublicId: string): void {
    this._notificaciones.update((arr) =>
      arr.map((n) => (n.matchPublicId === matchPublicId ? { ...n, vista: true } : n)),
    );
    this.guardarStorage();
  }

  clear(): void {
    this._notificaciones.set([]);
    this.cargado = false;
  }

  private agregar(payload: MatchNotification): void {
    this._notificaciones.update((arr) => {
      if (arr.some((n) => n.matchPublicId === payload.matchPublicId)) return arr;
      return [{ ...payload, vista: false }, ...arr];
    });
    this.guardarStorage();
  }

  private fusionar(remotas: MatchNotification[]): void {
    this._notificaciones.update((arr) => {
      const porId = new Map(arr.map((n) => [n.matchPublicId, n]));
      for (const remota of remotas) {
        const existente = porId.get(remota.matchPublicId);
        porId.set(remota.matchPublicId, { ...remota, vista: existente?.vista ?? false });
      }
      return [...porId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    this.guardarStorage();
  }

  private leerStorage(): NotificacionCoincidencia[] {
    try {
      const raw = localStorage.getItem(this.storageKey());
      return raw ? (JSON.parse(raw) as NotificacionCoincidencia[]) : [];
    } catch {
      return [];
    }
  }

  private guardarStorage(): void {
    localStorage.setItem(this.storageKey(), JSON.stringify(this._notificaciones()));
  }

  private storageKey(): string {
    const userId = this.currentUserId();
    return userId ? `${STORAGE_PREFIX}.${userId}` : STORAGE_PREFIX;
  }

  private currentUserId(): string | null {
    const token = this.tokenStorage.read()?.accessToken;
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
