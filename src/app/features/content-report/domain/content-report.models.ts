export type ContentReportTargetType = 'CHAT' | 'POST' | 'USER';

export const ContentReportReason = {
  SUSPICIOUS_BEHAVIOR: 'SUSPICIOUS_BEHAVIOR',
  FRAUD_OR_SCAM: 'FRAUD_OR_SCAM',
  IMPERSONATION: 'IMPERSONATION',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  PERSONAL_DATA_EXPOSED: 'PERSONAL_DATA_EXPOSED',
  FALSE_INFORMATION: 'FALSE_INFORMATION',
  SPAM: 'SPAM',
  DUPLICATE_REPORT: 'DUPLICATE_REPORT',
  OTHER: 'OTHER',
} as const;

export type ContentReportReason = typeof ContentReportReason[keyof typeof ContentReportReason];

export interface CreateContentReportCommand {
  targetType: ContentReportTargetType;
  targetPublicId: string;
  reason: ContentReportReason;
  description?: string;
}

export interface ContentReportResult {
  publicId: string;
  autoFlagged: boolean;
}
