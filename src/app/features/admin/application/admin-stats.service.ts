import { Injectable, inject } from '@angular/core';
import { AdminStatsHttp } from '../infrastructure/admin-stats.http';
import { AdminStats } from '../domain/admin-stats.model';

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private readonly http = inject(AdminStatsHttp);

  getStats(): Promise<AdminStats> {
    return this.http.getStats();
  }
}
