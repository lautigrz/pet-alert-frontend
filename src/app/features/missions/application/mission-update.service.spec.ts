import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { MissionUpdateService } from './mission-update.service';
import { MissionUpdateHttp, MissionUpdateOutput } from '../infrastructure/mission-update.http';

describe('MissionUpdateService', () => {
  let service: MissionUpdateService;
  let mockUpdateHttp: {
    getUpdates: ReturnType<typeof vi.fn>;
    createUpdate: ReturnType<typeof vi.fn>;
    scoreUpdate: ReturnType<typeof vi.fn>;
    getCommentPointValues: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockUpdateHttp = {
      getUpdates: vi.fn(),
      createUpdate: vi.fn(),
      scoreUpdate: vi.fn(),
      getCommentPointValues: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        MissionUpdateService,
        { provide: MissionUpdateHttp, useValue: mockUpdateHttp }
      ]
    });

    service = TestBed.inject(MissionUpdateService);
  });

  it('debería crear el servicio', () => {
    expect(service).toBeTruthy();
  });

  describe('getUpdates', () => {
    it('debería llamar a la API y retornar las actualizaciones', async () => {
      const updates = [{ publicId: 'u1', comment: 'test' }] as unknown as MissionUpdateOutput[];
      mockUpdateHttp.getUpdates.mockReturnValue(of(updates));

      const res = await firstValueFrom(service.getUpdates('m1'));
      expect(mockUpdateHttp.getUpdates).toHaveBeenCalledWith('m1');
      expect(res).toEqual(updates);
    });

    it('debería mapear el mensaje del backend ante un HttpErrorResponse al obtener actualizaciones', async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Error al obtener actualizaciones' },
        status: 500
      });
      mockUpdateHttp.getUpdates.mockReturnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.getUpdates('m1'));
        expect.fail('Debería haber fallado');
      } catch (err) {
        const error = err as Error;
        expect(error.message).toBe('Error al obtener actualizaciones');
      }
    });
  });

  describe('createUpdate', () => {
    const dto = {
      missionPublicId: 'm1',
      comment: 'nueva actualización'
    };

    it('debería llamar a la API y retornar la respuesta', async () => {
      const response = { updateId: 1, publicId: 'u1' };
      mockUpdateHttp.createUpdate.mockReturnValue(of(response));

      const res = await firstValueFrom(service.createUpdate(dto));
      expect(mockUpdateHttp.createUpdate).toHaveBeenCalledWith(dto);
      expect(res).toEqual(response);
    });

    it('debería mapear el mensaje del backend ante un HttpErrorResponse al crear actualización', async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Error al crear actualización' },
        status: 400
      });
      mockUpdateHttp.createUpdate.mockReturnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.createUpdate(dto));
        expect.fail('Debería haber fallado');
      } catch (err) {
        const error = err as Error;
        expect(error.message).toBe('Error al crear actualización');
      }
    });
  });

  describe('scoreUpdate', () => {
    it('debería valorar la actualización', async () => {
      mockUpdateHttp.scoreUpdate.mockReturnValue(of(undefined));
      await firstValueFrom(service.scoreUpdate('update-1', 25));
      expect(mockUpdateHttp.scoreUpdate).toHaveBeenCalledWith('update-1', 25);
    });

    it('debería mapear el mensaje del backend ante un HttpErrorResponse al valorar', async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Error al valorar' },
        status: 400
      });
      mockUpdateHttp.scoreUpdate.mockReturnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.scoreUpdate('update-1', 25));
        expect.fail('Debería haber fallado');
      } catch (err) {
        const error = err as Error;
        expect(error.message).toBe('Error al valorar');
      }
    });
  });

  describe('getCommentPointValues', () => {
    it('debería obtener los valores de puntuación', async () => {
      const points = [{ points: 10, label: '+10 XP' }];
      mockUpdateHttp.getCommentPointValues.mockReturnValue(of(points));

      const res = await firstValueFrom(service.getCommentPointValues());
      expect(mockUpdateHttp.getCommentPointValues).toHaveBeenCalled();
      expect(res).toEqual(points);
    });

    it('debería mapear el mensaje del backend ante un HttpErrorResponse al obtener valores', async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Error al obtener puntuaciones' },
        status: 500
      });
      mockUpdateHttp.getCommentPointValues.mockReturnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.getCommentPointValues());
        expect.fail('Debería haber fallado');
      } catch (err) {
        const error = err as Error;
        expect(error.message).toBe('Error al obtener puntuaciones');
      }
    });
  });
});
