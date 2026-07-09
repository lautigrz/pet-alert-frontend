import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of, } from 'rxjs';
import { catchError, map, switchMap, } from 'rxjs/operators';

import {
  MissionHttp,
} from '../infrastructure/mission.http';
import { CreateMissionDTO, CreateMissionResponse, MissionCardOutput, MissionOutput } from '../infrastructure/models/mission.model';

@Injectable({
  providedIn: 'root'
})
export class MissionService {

  private readonly missionHttp = inject(MissionHttp);

  createMission(dto: CreateMissionDTO): Observable<CreateMissionResponse> {
    return this.missionHttp.createMission(dto).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ??
            'No se pudo crear la misión'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  getMissions(): Observable<MissionCardOutput[]> {
    return this.missionHttp.getMissions().pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ?? 'No se pudieron obtener las misiones'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  getMissionDetail(publicId: string): Observable<MissionOutput> {
    return this.missionHttp.getMissionDetail(publicId).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ?? 'No se pudo obtener el detalle de la misión'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  joinMission(publicId: string): Observable<{ status: string; message: string }> {
    return this.missionHttp.joinMission(publicId).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ?? 'No se pudo unir a la misión'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  leaveMission(publicId: string): Observable<{ status: string; message: string }> {
    return this.missionHttp.leaveMission(publicId).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ?? 'No se pudo abandonar la misión'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  cancelMission(publicId: string): Observable<{ status: string; message: string }> {
    return this.missionHttp.cancelMission(publicId).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ?? 'No se pudo cancelar la misión'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  updateMission(
    publicId: string,
    dto: { title: string; description: string; latitude: number; longitude: number; radius: number }
  ): Observable<void> {
    return this.missionHttp.updateMission(publicId, dto).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ?? 'No se pudo actualizar la misión'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  getJoinedMissionsByUser(userPublicId: string): Observable<MissionOutput[]> {
    return this.getMissions().pipe(
      switchMap((missions) => {
        if (missions.length === 0) {
          return of([]);
        }

        return forkJoin(
          missions.map((mission) => this.getMissionDetail(mission.publicId)),
        );
      }),
      map((missions) =>
        missions.filter((mission) =>
          mission.volunteers.some(
            (volunteer) => volunteer.publicId === userPublicId,
          ),
        ),
      ),
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(
            () =>
              new Error(
                error.error?.message ??
                'No se pudieron obtener las misiones del usuario',
              ),
          );
        }

        return throwError(() => error);
      }),
    );
  }

  getActiveMissionsWithDetails(): Observable<MissionOutput[]> {
    return this.getMissions().pipe(
      switchMap((missions) => {
        if (missions.length === 0) {
          return of([]);
        }

        return forkJoin(
          missions.map((mission) => this.getMissionDetail(mission.publicId)),
        );
      }),
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(
            () =>
              new Error(
                error.error?.message ??
                'No se pudieron obtener las misiones del usuario',
              ),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
