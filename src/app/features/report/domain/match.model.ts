import { ReportDetail } from '../infrastructure/report.http';

export interface Match {
  matchPublicId: string;
  reportPublicId: string;
  userPublicId: string;
  name: string;
  image: string | null;
  username: string;
  foundAt: string | null;
  distanceKm: number | null;
  score: number;
  imageScore: number | null;
  descriptionScore: number | null;
}

export interface ReportMatches {
  report: ReportDetail;
  matches: Match[];
}
