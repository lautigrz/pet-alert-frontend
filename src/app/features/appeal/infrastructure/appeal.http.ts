import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CreateAppealRequest {
  token: string;
  message: string;
}

export interface CreateAppealResponse {
  message: string;
  publicId: string;
}

@Injectable({ providedIn: 'root' })
export class AppealHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createAppeal(body: CreateAppealRequest): Promise<CreateAppealResponse> {
    return firstValueFrom(
      this.http.post<CreateAppealResponse>(`${this.baseUrl}/appeals`, body),
    );
  }
}
