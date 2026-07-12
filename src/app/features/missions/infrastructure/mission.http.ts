import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateMissionDTO, CreateMissionResponse, MissionCardOutput, MissionOutput } from './models/mission.model';

@Injectable({
  providedIn: 'root'
})
export class MissionHttp {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createMission(body: CreateMissionDTO): Observable<CreateMissionResponse> {

    return this.http.post<CreateMissionResponse>(
      `${this.baseUrl}/missions`,
      body
    );
  }

  getMissions(): Observable<MissionCardOutput[]> {
    return this.http.get<MissionCardOutput[]>(`${this.baseUrl}/missions`);
  }

  getMissionDetail(publicId: string): Observable<MissionOutput> {
    return this.http.get<MissionOutput>(`${this.baseUrl}/missions/${publicId}`);
  }

  joinMission(publicId: string): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(
      `${this.baseUrl}/missions/${publicId}/join`,
      {},
    );
  }

  leaveMission(publicId: string): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(
      `${this.baseUrl}/missions/${publicId}/leave`,
      {}
    );
  }

  removeVolunteer(
    missionPublicId: string,
    volunteerPublicId: string,
  ): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(
      `${this.baseUrl}/missions/${missionPublicId}/volunteers/${volunteerPublicId}`,
    );
  }

  cancelMission(publicId: string): Observable<{ status: string; message: string }> {

    return this.http.post<{ status: string; message: string }>(
      `${this.baseUrl}/missions/${publicId}/cancel`,
      {},
    );
  }

  updateMission(
    publicId: string,
    body: { title: string; description: string; latitude: number; longitude: number; radius: number }
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/missions/${publicId}`,
      body
    );
  }

}
