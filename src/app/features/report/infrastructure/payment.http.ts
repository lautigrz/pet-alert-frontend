import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface FeaturedPreferenceResponse {
  initPoint: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  crearPreferenciaDestacado(publicId: string): Promise<FeaturedPreferenceResponse> {
    return firstValueFrom(
      this.http.post<FeaturedPreferenceResponse>(
        `${this.baseUrl}/payments/featured/${publicId}`,
        {},
      ),
    );
  }
}
