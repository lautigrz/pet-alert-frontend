import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ProfileHttp } from '../infrastructure/profile.http';
import { UpdatedProfile } from '../domain/profile.model';
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
      return {
        id: response.id,
        email: response.email,
        username: response.username,
        name: response.name,
        lastname: response.lastname,
        photoUrl: response.photoUrl,
      };
    } catch (error) {
      throw this.mapUpdateProfileError(error);
    }
  }

  async getProfile(): Promise<UpdatedProfile> {
  try {
    const response = await this.profileHttp.getProfile();

    return {
      id: response.id,
      email: response.email,
      username: response.username,
      name: response.name ?? null,
      lastname: response.lastname ?? null,
      photoUrl: response.photoUrl ?? null,
    };
  } catch (error) {
    throw this.mapUpdateProfileError(error);
  }
}

  async uploadProfilePhoto(file:File): Promise<UpdatedProfile> {
    try{
      const response = await this.profileHttp.uploadProfilePhoto(file);

      return{
        id: response.id,
        email: response.email,
        username: response.username,
        name: response.name ?? null,
        lastname: response.lastname ?? null,
        photoUrl: response.photoUrl ?? null
      };
    }catch(error){
      throw this.mapUpdateProfileError(error);
    }

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
