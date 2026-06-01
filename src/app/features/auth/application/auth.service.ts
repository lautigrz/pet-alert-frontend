import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthHttp } from '../infrastructure/auth.http';
import { TokenStorage } from '../infrastructure/token.storage';
import { RegisteredUser } from '../domain/user.model';
import { AuthTokens } from '../domain/auth.tokens';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidLoginDataError,
  InvalidRegistrationDataError,
  NetworkError,
  RateLimitedError,
  UnexpectedAuthError,
  SessionExpiredError,
} from '../domain/auth.errors';

export interface RegisterCommand {
  email: string;
  username: string;
  password: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authHttp = inject(AuthHttp);
  private readonly tokenStorage = inject(TokenStorage);

  async register(command: RegisterCommand): Promise<RegisteredUser> {
    try {
      const response = await this.authHttp.registerUser({
        email: command.email.trim().toLowerCase(),
        username: command.username.trim(),
        password: command.password,
      });
      return { id: response.id };
    } catch (error) {
      throw this.mapRegisterError(error);
    }
  }

  async login(command: LoginCommand): Promise<AuthTokens> {
    try {
      const response = await this.authHttp.loginUser({
        email: command.email.trim().toLowerCase(),
        password: command.password,
      });
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
      this.tokenStorage.save(tokens);
      return tokens;
    } catch (error) {
      throw this.mapLoginError(error);
    }
  }

  private refreshInFlight: Promise<string> | null = null;

  refreshSession(): Promise<string> {
    this.refreshInFlight ??= this.runRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async runRefresh(): Promise<string> {
    const stored = this.tokenStorage.read();
    if (!stored) throw new SessionExpiredError();
    const response = await this.authHttp.refreshAccessToken({
      refreshToken: stored.refreshToken,
    });
    this.tokenStorage.save({
      accessToken: response.accessToken,
      refreshToken: stored.refreshToken,
    });
    return response.accessToken;
  }

  async logout(): Promise<void> {
    const stored = this.tokenStorage.read();
    if (stored) await this.tryRevokeRefreshToken(stored.refreshToken);
    this.tokenStorage.clear();
  }

  private async tryRevokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      await this.authHttp.logout({ refreshToken });
    } catch {
      return;
    }
  }

  private mapRegisterError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new UnexpectedAuthError();
    }
    if (error.status === 0) return new NetworkError();
    if (error.status === 409) return new EmailAlreadyRegisteredError();
    if (error.status === 400) {
      return new InvalidRegistrationDataError(
        error.error?.error ?? 'Datos inválidos',
      );
    }
    return new UnexpectedAuthError();
  }

  private mapLoginError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new UnexpectedAuthError();
    }
    if (error.status === 0) return new NetworkError();
    if (error.status === 401) return new InvalidCredentialsError();
    if (error.status === 429) return new RateLimitedError();
    if (error.status === 400) {
      return new InvalidLoginDataError(error.error?.error ?? 'Datos inválidos');
    }
    return new UnexpectedAuthError();
  }
}
