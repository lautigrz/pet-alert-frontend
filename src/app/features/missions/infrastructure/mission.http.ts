import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CreateMissionRequest {
  reportPublicId: string;
  latitude: number;
  longitude: number;
  radius: number;
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class MissionHttp {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createMission(body: CreateMissionRequest): Promise<void> {

    return firstValueFrom(
      this.http.post<void>(
        `${this.baseUrl}/missions`,
        body
      )
    );

  }

  getMissions(): Promise<any[]> {

  return firstValueFrom(
    this.http.get<any[]>(
      `${this.baseUrl}/missions`
    )
  );

}

}