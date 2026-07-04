export type AppealTargetType = 'POST' | 'ACCOUNT';

export type AppealStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface AppealCase {
  reportedContent: { petName: string | null; reportType: 'LOST' | 'SIGHTING' } | null;
  reason: string | null;
  reportCount: number;
}

export interface AppealQueueItem {
  publicId: string;
  targetType: AppealTargetType;
  targetPublicId: string;
  message: string;
  status: AppealStatus;
  createdAt: string;
  appellant: { publicId: string; username: string };
  case: AppealCase;
}
