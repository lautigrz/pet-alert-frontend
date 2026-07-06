import { Injectable, inject } from '@angular/core';
import {
  MissionResponseHttp,
  CreateMissionResponseRequest
} from '../infrastructure/mission-response.http';

@Injectable({
  providedIn: 'root'
})
export class MissionResponseService {

  private readonly http = inject(MissionResponseHttp);

  create(body: CreateMissionResponseRequest): Promise<void> {

    return this.http.create(body);

  }

  getResponses(missionPublicId: string): Promise<any[]> {

  return this.http.getResponses(missionPublicId);

}

}