export const MATCH_EVENT = 'match:new';

export type MatchRole = 'dueno' | 'avistador';

export interface MatchNotification {
  ownerPublicId: string;
  rol: MatchRole;
  lostReportPublicId: string;
  lostPetName: string | null;
  lostPetImage: string | null;
  matchPublicId: string;
  matchedReportPublicId: string;
  matchedImage: string | null;
  score: number;
  imageScore?: number | null;
  descriptionScore?: number | null;
  createdAt: string;
}

export interface NotificacionCoincidencia extends MatchNotification {
  vista: boolean;
}
