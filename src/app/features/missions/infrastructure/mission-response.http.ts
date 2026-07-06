import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CreateMissionResponseRequest {

  missionPublicId: string;

  comment: string;

  photoUrl: string | null;

}

@Injectable({
  providedIn: 'root'
})
export class MissionResponseHttp {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  create(body: CreateMissionResponseRequest): Promise<void> {

    return firstValueFrom(

      this.http.post<void>(
        `${this.baseUrl}/mission-responses`,
        body
      )

    );

  }

  getResponses(missionPublicId: string): Promise<any[]> {

  return firstValueFrom(

    this.http.get<any[]>(

      `${this.baseUrl}/mission-responses/${missionPublicId}`

    )

  );

}

}