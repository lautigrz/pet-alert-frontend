import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppealAdminService } from './appeal-admin.service';
import { AppealAdminHttp } from '../infrastructure/appeal-admin.http';

const rawItem = {
  publicId: 'a-1',
  targetType: 'POST' as const,
  targetPublicId: 'post-1',
  message: 'defensa',
  status: 'PENDING',
  createdAt: '2026-06-20T00:00:00.000Z',
  appellant: { publicId: 'u-1', username: 'owner' },
  case: { reportedContent: { petName: 'Firulais', reportType: 'LOST' }, reason: 'FALSE_INFORMATION', reportCount: 2 },
};

describe('AppealAdminService', () => {
  let http: { getQueue: ReturnType<typeof vi.fn>; resolve: ReturnType<typeof vi.fn> };
  let service: AppealAdminService;

  beforeEach(() => {
    http = { getQueue: vi.fn().mockResolvedValue([rawItem]), resolve: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [AppealAdminService, { provide: AppealAdminHttp, useValue: http }],
    });

    service = TestBed.inject(AppealAdminService);
  });

  it('getQueue pide el status pedido y mapea al modelo con el caso', async () => {
    const items = await service.getQueue('PENDING');

    expect(http.getQueue).toHaveBeenCalledWith('PENDING');
    expect(items).toEqual([
      {
        publicId: 'a-1',
        targetType: 'POST',
        targetPublicId: 'post-1',
        message: 'defensa',
        status: 'PENDING',
        createdAt: '2026-06-20T00:00:00.000Z',
        appellant: { publicId: 'u-1', username: 'owner' },
        case: { reportedContent: { petName: 'Firulais', reportType: 'LOST' }, reason: 'FALSE_INFORMATION', reportCount: 2 },
      },
    ]);
  });

  it('normaliza un status desconocido a PENDING', async () => {
    http.getQueue.mockResolvedValue([{ ...rawItem, status: 'RARO' }]);

    const items = await service.getQueue('ACCEPTED');

    expect(items[0].status).toBe('PENDING');
  });

  it('resolve delega al http con el publicId y la decisión', async () => {
    await service.resolve('a-1', true);

    expect(http.resolve).toHaveBeenCalledWith('a-1', true);
  });
});
