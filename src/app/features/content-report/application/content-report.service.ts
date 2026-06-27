import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ContentReportHttp } from '../infrastructure/content-report.http';
import { ContentReportResult, CreateContentReportCommand } from '../domain/content-report.models';
import {
  AlreadyReportedError,
  CannotReportOwnContentError,
  ContentReportNetworkError,
  UnexpectedContentReportError,
} from '../domain/content-report.errors';

@Injectable({ providedIn: 'root' })
export class ContentReportService {
  private readonly contentReportHttp = inject(ContentReportHttp);

  async report(command: CreateContentReportCommand): Promise<ContentReportResult> {
    try {
      const description = command.description?.trim();
      const response = await this.contentReportHttp.createContentReport({
        targetType: command.targetType,
        targetPublicId: command.targetPublicId,
        reason: command.reason,
        description: description ? description : undefined,
      });
      return { publicId: response.publicId, autoFlagged: response.autoFlagged };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) return new UnexpectedContentReportError();
    if (error.status === 0) return new ContentReportNetworkError();
    if (error.status === 409) return new AlreadyReportedError();
    if (error.status === 403) return new CannotReportOwnContentError();
    return new UnexpectedContentReportError();
  }
}
