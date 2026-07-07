import { Injectable, inject } from '@angular/core';
import { AppealAdminHttp, AppealQueueItemResponse } from '../infrastructure/appeal-admin.http';
import { AppealQueueItem, AppealStatus } from '../domain/appeal-queue.model';

@Injectable({ providedIn: 'root' })
export class AppealAdminService {
  private readonly http = inject(AppealAdminHttp);

  async getQueue(status: AppealStatus): Promise<AppealQueueItem[]> {
    const responses = await this.http.getQueue(status);
    return responses.map((response) => this.toModel(response));
  }

  resolve(publicId: string, accept: boolean): Promise<void> {
    return this.http.resolve(publicId, accept);
  }

  private toModel(response: AppealQueueItemResponse): AppealQueueItem {
    return {
      publicId: response.publicId,
      targetType: response.targetType,
      targetPublicId: response.targetPublicId,
      message: response.message,
      status: this.normalizeStatus(response.status),
      createdAt: response.createdAt,
      appellant: response.appellant,
      case: {
        reportedContent: response.case.reportedContent
          ? {
              petName: response.case.reportedContent.petName,
              reportType: response.case.reportedContent.reportType === 'LOST' ? 'LOST' : 'SIGHTING',
            }
          : null,
        reason: response.case.reason,
        reportCount: response.case.reportCount,
      },
    };
  }

  private normalizeStatus(status: string): AppealStatus {
    if (status === 'ACCEPTED' || status === 'REJECTED') return status;
    return 'PENDING';
  }
}
