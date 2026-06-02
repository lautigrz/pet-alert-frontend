import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';


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

export interface CreateSightingReportRequest {
  type: 'sighting';
  petName?: string;
  genderType: ('MALE' | 'FEMALE') | null;
  sizeType: ('SMALL' | 'MEDIUM' | 'LARGE') | null;
  animalType: 'DOG' | 'CAT';
  breed?: string;
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
    const formData = new FormData();

    const reportData = {
      type: body.type.toUpperCase(),
      petName: body.petName,
      genderType: body.genderType,
      sizeType: body.sizeType,
      animalType: body.animalType,
      breed: body.breed,
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


    console.log('Report data to be sent:', reportData);
    
    formData.append('data', JSON.stringify(reportData));

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
