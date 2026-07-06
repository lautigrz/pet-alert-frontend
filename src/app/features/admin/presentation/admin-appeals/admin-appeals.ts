import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppealAdminService } from '../../application/appeal-admin.service';
import { ReportModerationService } from '../../application/report-moderation.service';
import { AppealQueueItem, AppealStatus, AppealTargetType } from '../../domain/appeal-queue.model';
import { ModerationReportView } from '../../domain/moderation-report.model';
import { ToastService } from '../../../../shared/application/toast.service';

const REASON_LABELS: Record<string, string> = {
  SUSPICIOUS_BEHAVIOR: 'Comportamiento sospechoso',
  FRAUD_OR_SCAM: 'Fraude o estafa',
  IMPERSONATION: 'Suplantación de identidad',
  INAPPROPRIATE_CONTENT: 'Contenido inapropiado',
  PERSONAL_DATA_EXPOSED: 'Datos personales expuestos',
  FALSE_INFORMATION: 'Información falsa o engañosa',
  SPAM: 'Spam o publicidad',
  DUPLICATE_REPORT: 'Reporte duplicado',
  OTHER: 'Otro',
};

interface SidebarOption {
  value: AppealStatus;
  label: string;
}

@Component({
  selector: 'app-admin-appeals',
  standalone: true,
  imports: [DatePipe],
  host: { class: 'flex flex-1 min-h-0' },
  templateUrl: './admin-appeals.html',
})
export class AdminAppealsComponent {
  private readonly service = inject(AppealAdminService);
  private readonly reportModeration = inject(ReportModerationService);
  private readonly toast = inject(ToastService);

  protected readonly selectedReport = signal<ModerationReportView | null>(null);
  protected readonly reportLoading = signal(false);

  protected readonly sections: SidebarOption[] = [
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'ACCEPTED', label: 'Aprobadas' },
    { value: 'REJECTED', label: 'Rechazadas' },
  ];

  protected readonly status = signal<AppealStatus>('PENDING');
  protected readonly appeals = signal<AppealQueueItem[]>([]);
  protected readonly pendingCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly resolvingId = signal<string | null>(null);

  constructor() {
    void this.load();
    void this.refreshPendingCount();
  }

  protected selectStatus(status: AppealStatus): void {
    if (this.status() === status) return;
    this.status.set(status);
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.appeals.set(await this.service.getQueue(this.status()));
    } catch {
      this.toast.error('No pudimos cargar las apelaciones.');
    } finally {
      this.loading.set(false);
    }
  }

  private async refreshPendingCount(): Promise<void> {
    try {
      this.pendingCount.set((await this.service.getQueue('PENDING')).length);
    } catch {
      /* el badge es secundario; si falla no molestamos al admin */
    }
  }

  protected async resolve(publicId: string, accept: boolean): Promise<void> {
    this.resolvingId.set(publicId);
    try {
      await this.service.resolve(publicId, accept);
      if (accept) this.toast.success('Apelación aceptada. Se recuperó el contenido.');
      else this.toast.info('Apelación rechazada. Se mantuvo la sentencia.');
      this.appeals.update((list) => list.filter((appeal) => appeal.publicId !== publicId));
      void this.refreshPendingCount();
    } catch {
      this.toast.error('No pudimos resolver la apelación.');
    } finally {
      this.resolvingId.set(null);
    }
  }

  protected targetLabel(type: AppealTargetType): string {
    return type === 'POST' ? 'Publicación' : 'Cuenta';
  }

  protected statusLabel(status: AppealStatus): string {
    return status === 'PENDING' ? 'Pendiente' : status === 'ACCEPTED' ? 'Aprobada' : 'Rechazada';
  }

  protected reasonLabel(reason: string | null): string {
    if (!reason) return 'Sin especificar';
    return REASON_LABELS[reason] ?? reason;
  }

  protected reportTypeLabel(type: 'LOST' | 'SIGHTING'): string {
    return type === 'LOST' ? 'Mascota perdida' : 'Mascota avistada';
  }

  protected profileLink(item: AppealQueueItem): string {
    return `/users/${item.targetPublicId}`;
  }

  protected async openReport(item: AppealQueueItem): Promise<void> {
    this.reportLoading.set(true);
    try {
      this.selectedReport.set(await this.reportModeration.getReport(item.targetPublicId));
    } catch {
      this.toast.error('No pudimos cargar el reporte denunciado.');
    } finally {
      this.reportLoading.set(false);
    }
  }

  protected closeReport(): void {
    this.selectedReport.set(null);
  }
}
