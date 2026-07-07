export type AppealTargetType = 'POST' | 'ACCOUNT';

export interface CreateAppealCommand {
  token: string;
  message: string;
}

export interface AppealResult {
  publicId: string;
}
