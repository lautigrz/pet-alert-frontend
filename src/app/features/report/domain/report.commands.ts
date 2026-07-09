import { Location } from './report.model';

export interface CreateLostReportCommand {
  petId: string;
  location: Location;
  description: string;
  occurredAt: Date;
  photos?: File[];
}

export interface CreateSightingReportCommand {
  petName: string | null;
  genderType: ('MALE' | 'FEMALE') | null;
  sizeType: ('SMALL' | 'MEDIUM' | 'LARGE') | null;
  animalType: 'DOG' | 'CAT';
  breed?: string;
  hasIdCollar: boolean;
  color: string;
  isInTransit: boolean;
  location: Location;
  description: string;
  occurredAt: Date;
  photos?: File[];
}

export interface UpdateSightingReportDetailsCommand {
  petName?: string | null;
  animalType?: 'DOG' | 'CAT';
  genderType?: ('MALE' | 'FEMALE') | null;
  sizeType?: ('SMALL' | 'MEDIUM' | 'LARGE') | null;
  breed?: string | null;
  hasIdCollar?: boolean;
  color?: string;
}

export interface UpdateLostReportDetailsCommand {
  petPublicId: string;
  name?: string | null;
  animalType?: 'DOG' | 'CAT';
  genderType?: ('MALE' | 'FEMALE') | null;
  sizeType?: ('SMALL' | 'MEDIUM' | 'LARGE') | null;
  breed?: string | null;
  color?: string;
  hasIdCollar?: boolean;
}

export interface UpdateReportCommand {
  publicId: string;
  description?: string;
  occurredAt?: Date;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  sightingDetails?: UpdateSightingReportDetailsCommand;
  lostDetails?: UpdateLostReportDetailsCommand;
  keepImageIds?: string[];
  newPhotos?: File[];
}

export type CreateReportCommand = CreateLostReportCommand | CreateSightingReportCommand;
