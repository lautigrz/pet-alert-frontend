import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminStats } from '../domain/admin-stats.model';

@Injectable({ providedIn: 'root' })
export class AdminStatsHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getStats(): Promise<AdminStats> {
    return firstValueFrom(this.http.get<AdminStats>(`${this.baseUrl}/admin/stats`));
  }
}
