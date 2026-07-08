import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AdminStatsService } from './admin-stats.service';
import { AdminStatsHttp } from '../infrastructure/admin-stats.http';
import { AdminStats } from '../domain/admin-stats.model';

describe('AdminStatsService', () => {
  let service: AdminStatsService;
  let http: { getStats: ReturnType<typeof vi.fn> };

  const fakeStats: AdminStats = {
    reportsByMonth: [{ month: '2026-07', lost: 2, sighting: 3 }],
    reunionRate: { total: 5, reunited: 1, rate: 20 },
    avgResolutionDays: 2,
  };

  beforeEach(() => {
    http = { getStats: vi.fn().mockResolvedValue(fakeStats) };
    TestBed.configureTestingModule({
      providers: [AdminStatsService, { provide: AdminStatsHttp, useValue: http }],
    });
    service = TestBed.inject(AdminStatsService);
  });

  it('delega en el http y devuelve las estadísticas', async () => {
    const result = await service.getStats();

    expect(http.getStats).toHaveBeenCalled();
    expect(result).toEqual(fakeStats);
  });
});
