import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ReportHttp, CreateReportResponse, ReportDetail } from '../infrastructure/report.http';
import {
  InvalidPetDataError,
  NetworkError,
  ReportSubmissionError,
} from '../domain/report.errors';
import { CreateLostReportCommand, CreateSightingReportCommand } from '../domain/report.commands';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly reportHttp = inject(ReportHttp);

  async submitLostReport(command: CreateLostReportCommand): Promise<CreateReportResponse> {
    try {
      const response = await this.reportHttp.createLostReport({
        type: 'lost',
        petId: command.petId,
        occurredAt: command.occurredAt,
        location: {
          address: command.location.address.trim(),
          latitude: command.location.latitude,
          longitude: command.location.longitude,
        },
        description: command.description.trim(),
      });
      return response;
    } catch (error) {
      throw this.mapReportError(error);
    }
  }

  async submitSightingReport(command: CreateSightingReportCommand): Promise<CreateReportResponse> {
    try {
      const response = await this.reportHttp.createSightingReport({
        type: 'sighting',
        petName: command.petName?.trim() ,
        animalType: command.animalType,
        genderType: command.genderType,
        sizeType: command.sizeType,
        breed: command.breed?.trim(),
        hasIdCollar: command.hasIdCollar,
        color: command.color.trim(),
        isInTransit: command.isInTransit,
        occurredAt: command.occurredAt,
        location: {
          address: command.location.address.trim(),
          latitude: command.location.latitude,
          longitude: command.location.longitude,
        },
        description: command.description.trim(),
        photos: command.photos,
      });
      return response;
    } catch (error) {
      throw this.mapReportError(error);
    }
  }

  private mapReportError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new ReportSubmissionError('Error inesperado al enviar reporte');
    }
    if (error.status === 0) return new NetworkError();
    if (error.status === 400) {
      return new ReportSubmissionError(
        error.error?.error ?? 'Datos de reporte inválidos'
      );
    }
    if (error.status === 404) {
      return new InvalidPetDataError('Mascota no encontrada');
    }
    return new ReportSubmissionError(
      error.error?.error ?? 'Error al enviar reporte'
    );
  }

   async getReportByPublicId(publicId: string): Promise<ReportDetail> {
    try {
      return await this.reportHttp.getReportByPublicId(publicId);
    } catch (error) {
      throw this.mapReportError(error);
    }
  }
}
