import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppealHttp } from '../infrastructure/appeal.http';
import { AppealResult, CreateAppealCommand } from '../domain/appeal.models';
import {
  AlreadyAppealedError,
  AppealNetworkError,
  InvalidAppealTokenError,
  UnexpectedAppealError,
} from '../domain/appeal.errors';

@Injectable({ providedIn: 'root' })
export class AppealService {
  private readonly appealHttp = inject(AppealHttp);

  async appeal(command: CreateAppealCommand): Promise<AppealResult> {
    try {
      const response = await this.appealHttp.createAppeal({
        token: command.token,
        message: command.message.trim(),
      });
      return { publicId: response.publicId };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) return new UnexpectedAppealError();
    if (error.status === 0) return new AppealNetworkError();
    if (error.status === 409) return new AlreadyAppealedError();
    if (error.status === 400) return new InvalidAppealTokenError();
    return new UnexpectedAppealError();
  }
}
