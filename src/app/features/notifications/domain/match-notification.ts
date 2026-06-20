export const MATCH_EVENT = 'match:new';

export interface MatchNotification {
  ownerPublicId: string;
  lostReportPublicId: string;
  lostPetName: string | null;
  matchPublicId: string;
  matchedReportPublicId: string;
  matchedImage: string | null;
  score: number;
  createdAt: string;
}

export interface NotificacionCoincidencia extends MatchNotification {
  vista: boolean;
}
