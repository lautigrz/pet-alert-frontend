import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ProfileHttp } from '../infrastructure/profile.http';
import { UpdatedProfile } from '../domain/profile.model';
import { PublicProfile } from '../domain/public-profile';
import {
  InvalidProfileDataError,
  NetworkError,
  UnexpectedProfileError,
  UserNotFoundError,
} from '../domain/profile.errors';
export interface UpdateProfileCommand{
  name?: string;
  lastname?: string;
  username?: string;
  photoUrl?: string;
}

@Injectable({providedIn: 'root'})
export class ProfileService {
  private readonly profileHttp = inject(ProfileHttp);

  private cachedProfile: UpdatedProfile | null = null;
  private inFlight: Promise<UpdatedProfile> | null = null;

  async updateProfile(
    command: UpdateProfileCommand,
  ): Promise<UpdatedProfile>{
    try{
      const response = await this.profileHttp.updateProfile({
        name: command.name?.trim() || undefined,
        lastname: command.lastname?.trim() || undefined,
        username: command.username?.trim() || undefined,
        photoUrl: command.photoUrl?.trim() || undefined,
      });
      this.cachedProfile = {
        id: response.id,
        email: response.email,
        username: response.username,
        name: response.name,
        lastname: response.lastname,
        photoUrl: response.photoUrl,
        role: this.cachedProfile?.role ?? null,
        stats: this.cachedProfile?.stats ?? null,
      };
      return this.cachedProfile;
    } catch (error) {
      throw this.mapUpdateProfileError(error);
    }
  }

  async getProfile(): Promise<UpdatedProfile> {
    if (this.cachedProfile) return this.cachedProfile;
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.fetchProfile().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async fetchProfile(): Promise<UpdatedProfile> {
    try {
      const response = await this.profileHttp.getProfile();
      this.cachedProfile = {
        id: response.id,
        email: response.email,
        username: response.username,
        name: response.name ?? null,
        lastname: response.lastname ?? null,
        photoUrl: response.photoUrl ?? null,
        role: response.role ?? null,
        stats: response.stats ?? null,
      };
      return this.cachedProfile;
    } catch (error) {
      throw this.mapUpdateProfileError(error);
    }
  }

  async getPublicProfile(publicId: string): Promise<PublicProfile> {
    try {
      const response = await this.profileHttp.getPublicProfile(publicId);
      return {
        id: response.id,
        username: response.username,
        name: response.name ?? null,
        lastname: response.lastname ?? null,
        photoUrl: response.photoUrl ?? null,
        stats: response.stats ?? null,
      };
    } catch (error) {
      throw this.mapUpdateProfileError(error);
    }
  }

  async uploadProfilePhoto(file:File): Promise<UpdatedProfile> {
    try{
      const response = await this.profileHttp.uploadProfilePhoto(file);

      this.cachedProfile = {
        id: response.id,
        email: response.email,
        username: response.username,
        name: response.name ?? null,
        lastname: response.lastname ?? null,
        photoUrl: response.photoUrl ?? null,
        role: this.cachedProfile?.role ?? null,
        stats: this.cachedProfile?.stats ?? null,
      };
      return this.cachedProfile;
    }catch(error){
      throw this.mapUpdateProfileError(error);
    }

  }

  clearCache(): void {
    this.cachedProfile = null;
    this.inFlight = null;
  }


  private mapUpdateProfileError(error:unknown) : Error{
    if(!(error instanceof HttpErrorResponse)){
      return new UnexpectedProfileError();
    }

    if(error.status === 0){
      return new NetworkError();
    }

    if(error.status === 400){
      return new InvalidProfileDataError(error.error?.error ?? 'Datos inválidos');
    }

    if(error.status === 404){
      return new UserNotFoundError();
    }

    return new UnexpectedProfileError();
  }
}
