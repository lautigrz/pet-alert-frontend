import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ContentReportAdminService } from '../../application/content-report-admin.service';
import {
  ContentReportQueueItem,
  ContentReportStatus,
} from '../../domain/content-report-queue.model';
import {
  ContentReportReason,
  ContentReportTargetType,
} from '../../../content-report/domain/content-report.models';

type AdminSection = 'posts' | 'chats';

type ConfirmableAction = 'delete';

interface PendingConfirmation {
  action: ConfirmableAction;
  item: ContentReportQueueItem;
  label: string;
  description: string;
}

const REASON_LABELS: Record<ContentReportReason, string> = {
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

const STATUS_LABELS: Record<ContentReportStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  SUSPENDED: 'Suspendida',
  DISMISSED: 'Descartada',
};

const STATUS_BADGE_CLASSES: Record<ContentReportStatus, string> = {
  PENDING: 'bg-[#E8842E]/10 text-[#E8842E]',
  APPROVED: 'bg-[#1D6FA3]/10 text-[#1D6FA3]',
  SUSPENDED: 'bg-[#12355B]/10 text-[#12355B]',
  DISMISSED: 'bg-slate-100 text-slate-500',
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe],
  host: { class: 'flex flex-1 min-h-0' },
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardComponent {
  private readonly service = inject(ContentReportAdminService);

  readonly section = signal<AdminSection>('posts');
  readonly status = signal<ContentReportStatus>('PENDING');
  readonly items = signal<ContentReportQueueItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selected = signal<ContentReportQueueItem | null>(null);
  readonly confirmation = signal<PendingConfirmation | null>(null);
  readonly editing = signal<ContentReportQueueItem | null>(null);
  readonly suspending = signal<ContentReportQueueItem | null>(null);
  readonly suspensionReason = signal('');

  readonly statusOptions = computed<{ value: ContentReportStatus; label: string }[]>(() => [
    { value: 'PENDING', label: 'Pendientes' },
    ...(this.section() === 'posts'
      ? [{ value: 'APPROVED' as ContentReportStatus, label: 'Aprobados' }]
      : []),
    { value: 'SUSPENDED', label: 'Suspendidos' },
    { value: 'DISMISSED', label: 'Descartados' },
  ]);

  readonly editorStatusOptions = computed<{ value: ContentReportStatus; label: string }[]>(() => {
    const values: ContentReportStatus[] =
      this.editing()?.targetType === 'POST'
        ? ['PENDING', 'APPROVED', 'SUSPENDED', 'DISMISSED']
        : ['PENDING', 'SUSPENDED', 'DISMISSED'];
    return values.map((value) => ({ value, label: STATUS_LABELS[value] }));
  });

  readonly posts = computed(() => this.items().filter((item) => item.targetType === 'POST'));
  readonly chats = computed(() => this.items().filter((item) => item.targetType === 'CHAT'));

  readonly pendingPosts = computed(
    () => this.posts().filter((item) => item.status === 'PENDING').length,
  );
  readonly pendingChats = computed(
    () => this.chats().filter((item) => item.status === 'PENDING').length,
  );

  readonly visibleItems = computed(() => {
    const target: ContentReportTargetType = this.section() === 'posts' ? 'POST' : 'CHAT';
    return this.items().filter(
      (item) => item.targetType === target && item.status === this.status(),
    );
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.items.set(await this.service.getQueue());
    } catch {
      this.error.set('No pudimos cargar las denuncias. Reintentá en unos segundos.');
    } finally {
      this.loading.set(false);
    }
  }

  selectSection(section: AdminSection): void {
    this.section.set(section);
    this.status.set('PENDING');
    this.selected.set(null);
  }

  approve(item: ContentReportQueueItem): void {
    this.applyStatus(item, 'APPROVED');
  }

  setStatus(status: ContentReportStatus): void {
    this.status.set(status);
    this.selected.set(null);
  }

  openDetail(item: ContentReportQueueItem): void {
    this.selected.set(item);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  openEditor(item: ContentReportQueueItem): void {
    this.editing.set(item);
  }

  closeEditor(): void {
    this.editing.set(null);
  }

  changeStatus(item: ContentReportQueueItem, status: ContentReportStatus): void {
    this.applyStatus(item, status);
    this.closeEditor();
  }

  openSuspension(item: ContentReportQueueItem): void {
    this.suspensionReason.set('');
    this.suspending.set(item);
  }

  cancelSuspension(): void {
    this.suspending.set(null);
    this.suspensionReason.set('');
  }

  confirmSuspension(): void {
    const item = this.suspending();
    const reason = this.suspensionReason().trim();
    if (!item || !reason) return;
    this.applyStatus(item, 'SUSPENDED', { suspensionReason: reason });
    this.cancelSuspension();
  }

  askDelete(item: ContentReportQueueItem): void {
    const isPost = item.targetType === 'POST';
    this.confirmation.set({
      action: 'delete',
      item,
      label: isPost ? 'Eliminar publicación' : 'Eliminar chat',
      description: isPost
        ? 'Vas a eliminar la publicación denunciada. Esta acción no se puede deshacer.'
        : 'Vas a eliminar el chat denunciado. Esta acción no se puede deshacer.',
    });
  }

  confirmAction(): void {
    const pending = this.confirmation();
    if (!pending) return;
    this.removeItem(pending.item);
    this.cancelConfirmation();
  }

  cancelConfirmation(): void {
    this.confirmation.set(null);
  }

  reasonLabel(reason: ContentReportReason): string {
    return REASON_LABELS[reason] ?? reason;
  }

  statusLabel(status: ContentReportStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusBadgeClass(status: ContentReportStatus): string {
    return STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.PENDING;
  }

  targetTypeLabel(targetType: ContentReportTargetType): string {
    return targetType === 'POST' ? 'Publicación' : 'Chat';
  }

  private applyStatus(
    item: ContentReportQueueItem,
    status: ContentReportStatus,
    patch: Partial<ContentReportQueueItem> = {},
  ): void {
    this.items.update((items) =>
      items.map((current) =>
        current.publicId === item.publicId ? { ...current, status, ...patch } : current,
      ),
    );
    const selected = this.selected();
    if (selected?.publicId === item.publicId) {
      this.selected.set({ ...selected, status, ...patch });
    }
  }

  private removeItem(item: ContentReportQueueItem): void {
    this.items.update((items) => items.filter((current) => current.publicId !== item.publicId));
    if (this.selected()?.publicId === item.publicId) this.closeDetail();
  }
}
