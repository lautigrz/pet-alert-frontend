import { Location } from './report.model';

export interface CreateLostReportCommand {
  petId: string;
  location: Location;
  description: string;
  occurredAt: Date;
}

export interface CreateSightingReportCommand {
  animalType: 'DOG' | 'CAT';
  hasIdCollar: boolean;
  color: string;
  isInTransit: boolean;
  location: Location;
  description: string;
  occurredAt: Date;
  photos?: File[];
}

export type CreateReportCommand = CreateLostReportCommand | CreateSightingReportCommand;
