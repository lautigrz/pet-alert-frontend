import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

// DTO para request LOST (sin archivos)
export interface CreateLostReportRequest {
  type: 'lost';
  petId: string;
  occurredAt: Date;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  description: string;
}

// DTO para request SIGHTING (con archivos)
export interface CreateSightingReportRequest {
  type: 'sighting';
  animalType: 'dog' | 'cat';
  hasIdCollar: boolean;
  color: string;
  isInTransit: boolean;
  occurredAt: Date;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  description: string;
  photos?: File[];
}

// DTO para response
export interface CreateReportResponse {
  publicId: string;
}

export interface ReportResponse {
  publicId: string;
  type: 'lost' | 'sighting';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReportHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createLostReport(body: CreateLostReportRequest): Promise<CreateReportResponse> {
    // LOST reports se envían como FormData con JSON stringificado en campo 'data'
    const formData = new FormData();

    const reportData = {
      type: body.type.toUpperCase(),
      petId: body.petId,
      occurredAt: body.occurredAt.toISOString(),
      location: {
        address: body.location.address,
        latitude: body.location.latitude,
        longitude: body.location.longitude,
      },
      description: body.description,
    };

    formData.append('data', JSON.stringify(reportData));

    return firstValueFrom(
      this.http.post<CreateReportResponse>(`${this.baseUrl}/reports`, formData),
    );
  }

  createSightingReport(body: CreateSightingReportRequest): Promise<CreateReportResponse> {
    // SIGHTING reports requieren FormData con JSON + archivos
    const formData = new FormData();

    const reportData = {
      type: body.type.toUpperCase(),
      animalType: body.animalType,
      hasIdCollar: body.hasIdCollar,
      color: body.color,
      isInTransit: body.isInTransit ?? false,
      occurredAt: body.occurredAt.toISOString(),
      location: {
        address: body.location.address,
        latitude: body.location.latitude,
        longitude: body.location.longitude,
      },
      description: body.description,
    };

    formData.append('data', JSON.stringify(reportData));

    // Agregar archivos de fotos (si existen)
    if (body.photos && body.photos.length > 0) {
      body.photos.forEach((photo: File) => {
        formData.append('photos', photo);
      });
    }

    return firstValueFrom(
      this.http.post<CreateReportResponse>(`${this.baseUrl}/reports`, formData),
    );
  }

  listUserReports(): Promise<ReportResponse[]> {
    return firstValueFrom(
      this.http.get<ReportResponse[]>(`${this.baseUrl}/reports`),
    );
  }

  getReportByPublicId(publicId: string): Promise<ReportResponse> {
    return firstValueFrom(
      this.http.get<ReportResponse>(`${this.baseUrl}/reports/${publicId}`),
    );
  }
}
