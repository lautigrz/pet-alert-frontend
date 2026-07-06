import { Injectable, inject } from '@angular/core';
import { ReportModerationHttp, ReportModerationResponse } from '../infrastructure/report-moderation.http';
import { ModerationReportView } from '../domain/moderation-report.model';

@Injectable({ providedIn: 'root' })
export class ReportModerationService {
  private readonly http = inject(ReportModerationHttp);

  async getReport(publicId: string): Promise<ModerationReportView> {
    return this.toView(await this.http.getReport(publicId));
  }

  private toView(response: ReportModerationResponse): ModerationReportView {
    return {
      type: response.type === 'LOST' ? 'LOST' : 'SIGHTING',
      description: response.description,
      address: response.location.address,
      occurredAt: response.occurredAt,
      images: response.details.images.map((image) => image.url),
      petName: response.details.name ?? response.details.petName ?? null,
      animalType: response.details.animalType,
      color: response.details.color,
    };
  }
}
