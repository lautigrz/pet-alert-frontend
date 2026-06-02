import { Location } from './report.model';

export interface CreateLostReportCommand {
  petId: string;
  location: Location;
  description: string;
  occurredAt: Date;
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

export type CreateReportCommand = CreateLostReportCommand | CreateSightingReportCommand;
