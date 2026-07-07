import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  MissionUpdateHttp,
  MissionUpdateOutput,
  CreateMissionUpdateDTO,
  CreateMissionUpdateResponse
} from '../infrastructure/mission-update.http';

@Injectable({
  providedIn: 'root'
})
export class MissionUpdateService {

  private readonly updateHttp = inject(MissionUpdateHttp);

  getUpdates(missionPublicId: string): Observable<MissionUpdateOutput[]> {
    return this.updateHttp.getUpdates(missionPublicId).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ??
            'No se pudieron obtener las actualizaciones'
          ));
        }
        return throwError(() => error);
      })
    );
  }

  createUpdate(dto: CreateMissionUpdateDTO): Observable<CreateMissionUpdateResponse> {
    return this.updateHttp.createUpdate(dto).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          return throwError(() => new Error(
            error.error?.message ??
            'No se pudo enviar la actualización'
          ));
        }
        return throwError(() => error);
      })
    );
  }

}
