import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentReportService } from './content-report.service';
import { ContentReportHttp } from '../infrastructure/content-report.http';
import { ContentReportReason, CreateContentReportCommand } from '../domain/content-report.models';

function makeCommand(overrides: Partial<CreateContentReportCommand> = {}): CreateContentReportCommand {
  return {
    targetType: overrides.targetType ?? 'CHAT',
    targetPublicId: overrides.targetPublicId ?? 'target-uuid',
    reason: overrides.reason ?? ContentReportReason.SUSPICIOUS_BEHAVIOR,
    description: overrides.description,
  };
}

describe('ContentReportService', () => {
  let contentReportHttp: { createContentReport: ReturnType<typeof vi.fn> };
  let service: ContentReportService;

  beforeEach(() => {
    contentReportHttp = {
      createContentReport: vi.fn().mockResolvedValue({ message: 'ok', publicId: 'cr-1', autoFlagged: false }),
    };

    TestBed.configureTestingModule({
      providers: [
        ContentReportService,
        { provide: ContentReportHttp, useValue: contentReportHttp },
      ],
    });

    service = TestBed.inject(ContentReportService);
  });

  it('llama al http con el comando y retorna el resultado', async () => {
    const result = await service.report(makeCommand({ description: 'hola' }));

    expect(contentReportHttp.createContentReport).toHaveBeenCalledWith({
      targetType: 'CHAT',
      targetPublicId: 'target-uuid',
      reason: ContentReportReason.SUSPICIOUS_BEHAVIOR,
      description: 'hola',
    });
    expect(result).toEqual({ publicId: 'cr-1', autoFlagged: false });
  });

  it('recorta la descripción y envía undefined si queda vacia', async () => {
    await service.report(makeCommand({ description: '   ' }));

    const [body] = contentReportHttp.createContentReport.mock.calls[0];
    expect(body.description).toBeUndefined();
  });

  it('propaga autoFlagged true del backend', async () => {
    contentReportHttp.createContentReport.mockResolvedValue({ message: 'ok', publicId: 'cr-2', autoFlagged: true });

    const result = await service.report(makeCommand());

    expect(result.autoFlagged).toBe(true);
  });

  it('mapea 409 a AlreadyReportedError', async () => {
    contentReportHttp.createContentReport.mockRejectedValue(new HttpErrorResponse({ status: 409 }));

    await expect(service.report(makeCommand())).rejects.toThrow('Ya enviaste una denuncia para este contenido.');
  });

  it('mapea 403 a CannotReportOwnContentError', async () => {
    contentReportHttp.createContentReport.mockRejectedValue(new HttpErrorResponse({ status: 403 }));

    await expect(service.report(makeCommand())).rejects.toThrow('No podés denunciar tu propio contenido.');
  });

  it('mapea error de red (status 0)', async () => {
    contentReportHttp.createContentReport.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

    await expect(service.report(makeCommand())).rejects.toThrow(
      'No pudimos conectar con el servidor. Reintentá en unos segundos.',
    );
  });
});
