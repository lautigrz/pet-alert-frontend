import {
  ContentReportReason,
  ContentReportTargetType,
} from '../../content-report/domain/content-report.models';

export type ContentReportStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'DISMISSED';

export interface ReportedUserSummary {
  username: string;
  email: string | null;
}

export interface ReportedContentSummary {
  petName: string | null;
  reportType: 'LOST' | 'SIGHTING';
}

export interface ContentReportQueueItem {
  publicId: string;
  targetType: ContentReportTargetType;
  targetPublicId: string;
  reason: ContentReportReason;
  status: ContentReportStatus;
  description: string | null;
  autoFlagged: boolean;
  createdAt: string;
  reportCount: number;
  suspensionReason: string | null;
  reportedUser: ReportedUserSummary | null;
  reportedContent: ReportedContentSummary | null;
  reporter: ReportedUserSummary;
}
