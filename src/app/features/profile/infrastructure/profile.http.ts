import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { UserExperienceSummary } from '../domain/profile.model';

export interface UpdateProfileRequest{
  name?: string;
  lastname?: string;
  username?: string;
  photoUrl?: string;
}

export interface UpdateProfileResponse{
  id: string;
  email: string;
  username: string;
  name: string | null;
  lastname: string | null;
  photoUrl: string | null;
}

export interface GetProfileResponse {
  id: string;
  email: string;
  username: string;
  name?: string;
  lastname?: string;
  photoUrl?: string;
  role?: string;
}

export interface PublicProfileResponse {
  id: string;
  username: string;
  name?: string;
  lastname?: string;
  photoUrl?: string;
}

@Injectable({ providedIn: 'root'})
export class ProfileHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  updateProfile(
    body: UpdateProfileRequest,
  ): Promise<UpdateProfileResponse>{
    return firstValueFrom(
      this.http.patch<UpdateProfileResponse>(`${this.baseUrl}/users/me`, body),
    );
  }

  getProfile(): Promise<GetProfileResponse> {
  return firstValueFrom(
    this.http.get<GetProfileResponse>(`${this.baseUrl}/users/me`),
  );
}

  getPublicProfile(publicId: string): Promise<PublicProfileResponse> {
    return firstValueFrom(
      this.http.get<PublicProfileResponse>(`${this.baseUrl}/users/${publicId}`),
    );
  }

  uploadProfilePhoto(file: File): Promise<UpdateProfileResponse>{
    const formData = new FormData();
    formData.append('photo',file);
    return firstValueFrom(this.http.post<UpdateProfileResponse>(`${this.baseUrl}/users/me/photo`, formData));
  }

  getUserExperience(): Promise<UserExperienceSummary> {
    return firstValueFrom(this.http.get<UserExperienceSummary>(`${this.baseUrl}/users/me/xp`));
  }

}

