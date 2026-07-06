import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import {
  MissionHttp,
  CreateMissionRequest
} from '../infrastructure/mission.http';

@Injectable({
  providedIn: 'root'
})
export class MissionService {

  private readonly missionHttp = inject(MissionHttp);

  async createMission(command: CreateMissionRequest): Promise<void> {

    try {

      await this.missionHttp.createMission(command);

    } catch (error) {

      if (error instanceof HttpErrorResponse) {
        throw new Error(
          error.error?.message ??
          'No se pudo crear la misión'
        );
      }

      throw error;
    }
  }

  async getMissions(): Promise<any[]> {

  return await this.missionHttp.getMissions();

}

}