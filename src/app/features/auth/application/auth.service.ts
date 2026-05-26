import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthHttp } from '../infrastructure/auth.http';
import { RegisteredUser } from '../domain/user.model';
import {
  EmailAlreadyRegisteredError,
  InvalidRegistrationDataError,
  NetworkError,
  UnexpectedAuthError,
} from '../domain/auth.errors';

export interface RegisterCommand {
  email: string;
  username: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authHttp = inject(AuthHttp);

  async register(command: RegisterCommand): Promise<RegisteredUser> {
    try {
      const response = await this.authHttp.registerUser({
        email: command.email.trim().toLowerCase(),
        username: command.username.trim(),
        password: command.password,
      });
      return { id: response.id };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
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
}
