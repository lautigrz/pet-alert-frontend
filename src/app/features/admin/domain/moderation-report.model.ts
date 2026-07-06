export interface ModerationReportView {
  type: 'LOST' | 'SIGHTING';
  description: string;
  address: string;
  occurredAt: string;
  images: string[];
  petName: string | null;
  animalType: string;
  color: string;
}
