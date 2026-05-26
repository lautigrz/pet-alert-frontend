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

@Injectable({ providedIn: 'root' })
export class AuthHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  registerUser(body: RegisterUserRequest): Promise<RegisterUserResponse> {
    return firstValueFrom(
      this.http.post<RegisterUserResponse>(`${this.baseUrl}/users`, body),
    );
  }
}
