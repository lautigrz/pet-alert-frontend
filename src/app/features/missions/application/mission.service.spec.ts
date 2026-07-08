import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { MissionService } from './mission.service';
import { MissionHttp } from '../infrastructure/mission.http';
import { MissionCardOutput, MissionOutput } from '../infrastructure/models/mission.model';

describe('MissionService', () => {
  let service: MissionService;
  let mockMissionHttp: {
    createMission: ReturnType<typeof vi.fn>;
    getMissions: ReturnType<typeof vi.fn>;
    getMissionDetail: ReturnType<typeof vi.fn>;
    joinMission: ReturnType<typeof vi.fn>;
    leaveMission: ReturnType<typeof vi.fn>;
    cancelMission: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockMissionHttp = {
      createMission: vi.fn(),
      getMissions: vi.fn(),
      getMissionDetail: vi.fn(),
      joinMission: vi.fn(),
      leaveMission: vi.fn(),
      cancelMission: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        MissionService,
        { provide: MissionHttp, useValue: mockMissionHttp }
      ]
    });

    service = TestBed.inject(MissionService);
  });

  it('debería crear el servicio', () => {
    expect(service).toBeTruthy();
  });

  describe('createMission', () => {
    const dto = {
      reportPublicId: 'r1',
      latitude: 10,
      longitude: 20,
      radius: 100,
      title: 'Título',
      description: 'Descripción'
    };

    it('debería llamar a la API y retornar la respuesta', async () => {
      const response = { missionId: 1, publicId: 'm1' };
      mockMissionHttp.createMission.mockReturnValue(of(response));

      const res = await firstValueFrom(service.createMission(dto));
      expect(mockMissionHttp.createMission).toHaveBeenCalledWith(dto);
      expect(res).toEqual(response);
    });

    it('debería mapear el mensaje del backend ante un HttpErrorResponse', async () => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Mensaje de error' },
        status: 400
      });
      mockMissionHttp.createMission.mockReturnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.createMission(dto));
        expect.fail('Debería haber fallado');
      } catch (err) {
        const error = err as Error;
        expect(error.message).toBe('Mensaje de error');
      }
    });
  });

  describe('getMissions', () => {
    it('debería retornar el listado de misiones', async () => {
      const list = [{ publicId: 'm1', status: 'OPEN' }] as unknown as MissionCardOutput[];
      mockMissionHttp.getMissions.mockReturnValue(of(list));

      const res = await firstValueFrom(service.getMissions());
      expect(mockMissionHttp.getMissions).toHaveBeenCalled();
      expect(res).toEqual(list);
    });
  });

  describe('getMissionDetail', () => {
    it('debería retornar el detalle de la misión', async () => {
      const detail = { publicId: 'm1', title: 'Título' } as unknown as MissionOutput;
      mockMissionHttp.getMissionDetail.mockReturnValue(of(detail));

      const res = await firstValueFrom(service.getMissionDetail('m1'));
      expect(mockMissionHttp.getMissionDetail).toHaveBeenCalledWith('m1');
      expect(res).toEqual(detail);
    });
  });

  describe('joinMission', () => {
    it('debería llamar a unirse y retornar el estado', async () => {
      const statusRes = { status: 'success', message: 'Joined' };
      mockMissionHttp.joinMission.mockReturnValue(of(statusRes));

      const res = await firstValueFrom(service.joinMission('m1'));
      expect(mockMissionHttp.joinMission).toHaveBeenCalledWith('m1');
      expect(res).toEqual(statusRes);
    });
  });

  describe('leaveMission', () => {
    it('debería llamar a abandonar y retornar el estado', async () => {
      const statusRes = { status: 'success', message: 'Left' };
      mockMissionHttp.leaveMission.mockReturnValue(of(statusRes));

      const res = await firstValueFrom(service.leaveMission('m1'));
      expect(mockMissionHttp.leaveMission).toHaveBeenCalledWith('m1');
      expect(res).toEqual(statusRes);
    });
  });

  describe('cancelMission', () => {
    it('debería llamar a cancelar y retornar el estado', async () => {
      const statusRes = { status: 'success', message: 'Canceled' };
      mockMissionHttp.cancelMission.mockReturnValue(of(statusRes));

      const res = await firstValueFrom(service.cancelMission('m1'));
      expect(mockMissionHttp.cancelMission).toHaveBeenCalledWith('m1');
      expect(res).toEqual(statusRes);
    });
  });
});
