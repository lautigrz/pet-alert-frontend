import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { SocketService } from '../../../core/services/socket.service';
import { SeenMatchesStore } from '../../report/application/seen-matches.store';
import { NotificationsHttp } from '../infrastructure/notifications.http';
import { MATCH_EVENT, MatchNotification } from '../domain/match-notification';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly socketService = inject(SocketService);
  private readonly notificationsHttp = inject(NotificationsHttp);
  private readonly seenMatchesStore = inject(SeenMatchesStore);

  private readonly _notificaciones = signal<MatchNotification[]>([]);
  readonly notificaciones = this._notificaciones.asReadonly();
  readonly noVistas = computed(
    () => this._notificaciones().filter((n) => this.seenMatchesStore.isNew(n.matchPublicId)).length,
  );

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
    try {
      const [remotas] = await Promise.all([
        this.notificationsHttp.getMine(),
        this.seenMatchesStore.ensureLoaded(),
      ]);
      this.fusionar(remotas);
    } catch {
      this.cargado = false;
    }
  }

  esNueva(matchPublicId: string): boolean {
    return this.seenMatchesStore.isNew(matchPublicId);
  }

  clear(): void {
    this._notificaciones.set([]);
    this.cargado = false;
    this.seenMatchesStore.reset();
  }

  private agregar(payload: MatchNotification): void {
    this._notificaciones.update((arr) => {
      if (arr.some((n) => n.matchPublicId === payload.matchPublicId)) return arr;
      return [payload, ...arr];
    });
  }

  private fusionar(remotas: MatchNotification[]): void {
    this._notificaciones.update((arr) => {
      const porId = new Map(arr.map((n) => [n.matchPublicId, n]));
      for (const remota of remotas) {
        porId.set(remota.matchPublicId, remota);
      }
      return [...porId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  async markSeen(matchPublicId: string): Promise<void> {
    await this.seenMatchesStore.markSeen(matchPublicId);
  }
}
