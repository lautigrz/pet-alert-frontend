import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppealService } from './appeal.service';
import { AppealHttp } from '../infrastructure/appeal.http';

describe('AppealService', () => {
  let appealHttp: { createAppeal: ReturnType<typeof vi.fn> };
  let service: AppealService;

  beforeEach(() => {
    appealHttp = { createAppeal: vi.fn().mockResolvedValue({ message: 'ok', publicId: 'a-1' }) };

    TestBed.configureTestingModule({
      providers: [AppealService, { provide: AppealHttp, useValue: appealHttp }],
    });

    service = TestBed.inject(AppealService);
  });

  it('llama al http con el token y el mensaje recortado, y retorna el publicId', async () => {
    const result = await service.appeal({ token: 'tok', message: '  mi defensa  ' });

    expect(appealHttp.createAppeal).toHaveBeenCalledWith({ token: 'tok', message: 'mi defensa' });
    expect(result).toEqual({ publicId: 'a-1' });
  });

  it('mapea 409 a AlreadyAppealedError', async () => {
    appealHttp.createAppeal.mockRejectedValue(new HttpErrorResponse({ status: 409 }));

    await expect(service.appeal({ token: 'tok', message: 'x' })).rejects.toThrow('Ya enviaste una apelación para este caso.');
  });

  it('mapea 400 a InvalidAppealTokenError', async () => {
    appealHttp.createAppeal.mockRejectedValue(new HttpErrorResponse({ status: 400 }));

    await expect(service.appeal({ token: 'bad', message: 'x' })).rejects.toThrow('El enlace de apelación es inválido o expiró.');
  });

  it('mapea error de red (status 0)', async () => {
    appealHttp.createAppeal.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

    await expect(service.appeal({ token: 'tok', message: 'x' })).rejects.toThrow(
      'No pudimos conectar con el servidor. Reintentá en unos segundos.',
    );
  });
});
