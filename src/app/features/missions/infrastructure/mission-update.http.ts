import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MissionUpdateOutput {
  publicId: string;
  comment: string;
  photoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    publicId: string;
    username: string;
    photoUrl: string | null;
    name: string | null;
    lastname: string | null;
  };
  pointValue?: {
    points: number;
    label: string;
  } | null;
}

export interface CommentPointValueOutput {
  points: number;
  label: string;
}

export interface CreateMissionUpdateDTO {
  missionPublicId: string;
  comment: string;
  photoUrl?: string;
}

export interface CreateMissionUpdateResponse {
  updateId: number;
  publicId: string;
}

@Injectable({
  providedIn: 'root'
})
export class MissionUpdateHttp {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getUpdates(missionPublicId: string): Observable<MissionUpdateOutput[]> {
    return this.http.get<MissionUpdateOutput[]>(
      `${this.baseUrl}/mission-updates/${missionPublicId}`
    );
  }

  createUpdate(body: CreateMissionUpdateDTO): Observable<CreateMissionUpdateResponse> {
    return this.http.post<CreateMissionUpdateResponse>(
      `${this.baseUrl}/mission-updates`,
      body
    );
  }

  scoreUpdate(updatePublicId: string, points: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/mission-updates/${updatePublicId}/score`,
      { points }
    );
  }

  getCommentPointValues(): Observable<CommentPointValueOutput[]> {
    return this.http.get<CommentPointValueOutput[]>(
      `${this.baseUrl}/mission-updates/point-values`
    );
  }

}
