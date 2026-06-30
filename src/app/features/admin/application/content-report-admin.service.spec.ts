import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ContentReportAdminService } from './content-report-admin.service';
import { ContentReportAdminHttp } from '../infrastructure/content-report-admin.http';

describe('ContentReportAdminService', () => {
  let service: ContentReportAdminService;
  let http: { getQueue: ReturnType<typeof vi.fn>; resolve: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    http = {
      getQueue: vi.fn().mockResolvedValue([]),
      resolve: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        ContentReportAdminService,
        { provide: ContentReportAdminHttp, useValue: http },
      ],
    });

    service = TestBed.inject(ContentReportAdminService);
  });

  it('mapea APPROVED a REVIEWED al resolver', async () => {
    await service.resolve('cr-1', 'APPROVED');

    expect(http.resolve).toHaveBeenCalledWith('cr-1', 'REVIEWED', undefined);
  });

  it('envía SUSPENDED con el motivo', async () => {
    await service.resolve('cr-1', 'SUSPENDED', 'fraude');

    expect(http.resolve).toHaveBeenCalledWith('cr-1', 'SUSPENDED', 'fraude');
  });

  it('envía DISMISSED tal cual', async () => {
    await service.resolve('cr-1', 'DISMISSED');

    expect(http.resolve).toHaveBeenCalledWith('cr-1', 'DISMISSED', undefined);
  });

  it('consulta también las denuncias SUSPENDED en la cola', async () => {
    await service.getQueue();

    expect(http.getQueue).toHaveBeenCalledWith('SUSPENDED');
  });
});
