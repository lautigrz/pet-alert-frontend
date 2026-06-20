import { inject, Injectable } from '@angular/core';

import { TokenStorage } from '../../auth/infrastructure/token.storage';

const STORAGE_PREFIX = 'petfinder.seenMatches';

@Injectable({ providedIn: 'root' })
export class SeenMatchesStore {
  private readonly tokenStorage = inject(TokenStorage);

  isNew(reportPublicId: string, candidateId: string): boolean {
    return !this.read().has(`${reportPublicId}|${candidateId}`);
  }

  markSeen(reportPublicId: string, candidateId: string): void {
    const seen = this.read();
    seen.add(`${reportPublicId}|${candidateId}`);
    this.write(seen);
  }

  private read(): Set<string> {
    try {
      const raw = localStorage.getItem(this.storageKey());
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  }

  private write(seen: Set<string>): void {
    localStorage.setItem(this.storageKey(), JSON.stringify([...seen]));
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
