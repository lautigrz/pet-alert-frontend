import { Injectable } from '@angular/core';
import { AuthTokens } from '../domain/auth.tokens';

const ACCESS_KEY = 'petfinder.accessToken';
const REFRESH_KEY = 'petfinder.refreshToken';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  save(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  read(): AuthTokens | null {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  }
}
