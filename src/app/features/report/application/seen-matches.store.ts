import { inject, Injectable, signal } from '@angular/core';

import { MatchViewsHttp } from '../infrastructure/match-views.http';

@Injectable({ providedIn: 'root' })
export class SeenMatchesStore {
  private readonly matchViewsHttp = inject(MatchViewsHttp);

  private readonly seen = signal<Set<string>>(new Set());
  private loaded = false;

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const ids = await this.matchViewsHttp.getSeen();
      this.seen.set(new Set(ids));
      this.loaded = true;
    } catch {
      this.loaded = false;
    }
  }

  isNew(matchPublicId: string): boolean {
    return !this.seen().has(matchPublicId);
  }

  async markSeen(matchPublicId: string): Promise<void> {
    if (this.seen().has(matchPublicId)) return;
    this.seen.update((current) => new Set(current).add(matchPublicId));
    try {
      await this.matchViewsHttp.markSeen(matchPublicId);
    } catch {
      this.seen.update((current) => {
        const next = new Set(current);
        next.delete(matchPublicId);
        return next;
      });
    }
  }

  reset(): void {
    this.seen.set(new Set());
    this.loaded = false;
  }
}
