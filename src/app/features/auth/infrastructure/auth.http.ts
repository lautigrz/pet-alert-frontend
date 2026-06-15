import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RegisterUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterUserResponse {
  id: string;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  registerUser(body: RegisterUserRequest): Promise<RegisterUserResponse> {
    return firstValueFrom(
      this.http.post<RegisterUserResponse>(`${this.baseUrl}/users`, body),
    );
  }

  loginUser(body: LoginUserRequest): Promise<LoginUserResponse> {
    return firstValueFrom(
      this.http.post<LoginUserResponse>(`${this.baseUrl}/auth/login`, body),
    );
  }
  
  refreshAccessToken(body: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return firstValueFrom(
      this.http.post<RefreshTokenResponse>(`${this.baseUrl}/auth/refresh`, body),
    );
  }

  logout(body: LogoutRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/auth/logout`, body),
    );
  }

  verifyEmail(body: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return firstValueFrom(
      this.http.post<VerifyEmailResponse>(`${this.baseUrl}/users/verify-email`, body),
    );
  }

  forgotPassword(body: ForgotPasswordRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/auth/forgot-password`, body),
    );
  }

  resetPassword(body: ResetPasswordRequest): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/auth/reset-password`, body),
    );
  }
}
