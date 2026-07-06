import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContentReportAdminService } from '../../application/content-report-admin.service';
import { AdminEstadisticasComponent } from '../admin-estadisticas/admin-estadisticas';
import { ToastService } from '../../../../shared/application/toast.service';
import {
  ContentReportQueueItem,
  ContentReportStatus,
  ReportedUserSummary,
} from '../../domain/content-report-queue.model';
import {
  ContentReportReason,
  ContentReportTargetType,
} from '../../../content-report/domain/content-report.models';

type AdminSection = 'posts' | 'chats' | 'profiles' | 'estadisticas';

type ConfirmableAction = 'delete';

interface PendingConfirmation {
  action: ConfirmableAction;
  item: ContentReportQueueItem;
  label: string;
  description: string;
}

interface ContentReportGroup {
  targetPublicId: string;
  targetType: ContentReportTargetType;
  title: string;
  reportedUser: ReportedUserSummary | null;
  reportCount: number;
  pendingCount: number;
  items: ContentReportQueueItem[];
}

function buildGroupTitle(item: ContentReportQueueItem): string {
  const content = item.reportedContent;
  if (content?.petName) {
    return content.petName;
  }
  if (content) {
    return content.reportType === 'LOST' ? 'Mascota perdida' : 'Mascota avistada';
  }
  if (item.targetType === 'USER') {
    return item.reportedUser?.username ?? 'Perfil reportado';
  }
  return item.targetType === 'CHAT' ? 'Chat reportado' : 'Publicación reportada';
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
  imports: [DatePipe, AdminEstadisticasComponent],
  host: { class: 'flex flex-1 min-h-0' },
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardComponent {
  private readonly service = inject(ContentReportAdminService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

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
        ? ['PENDING', 'APPROVED', 'DISMISSED']
        : ['PENDING', 'DISMISSED'];
    return values.map((value) => ({ value, label: STATUS_LABELS[value] }));
  });

  readonly posts = computed(() => this.items().filter((item) => item.targetType === 'POST'));
  readonly chats = computed(() => this.items().filter((item) => item.targetType === 'CHAT'));
  readonly profiles = computed(() => this.items().filter((item) => item.targetType === 'USER'));

  readonly pendingPosts = computed(
    () => this.posts().filter((item) => item.status === 'PENDING').length,
  );
  readonly pendingChats = computed(
    () => this.chats().filter((item) => item.status === 'PENDING').length,
  );
  readonly pendingProfiles = computed(
    () => this.profiles().filter((item) => item.status === 'PENDING').length,
  );

  readonly visibleItems = computed(() => {
    const target: ContentReportTargetType =
      this.section() === 'posts' ? 'POST' : this.section() === 'chats' ? 'CHAT' : 'USER';
    return this.items().filter(
      (item) => item.targetType === target && item.status === this.status(),
    );
  });

  readonly groupedItems = computed<ContentReportGroup[]>(() => {
    const pendingByTarget = new Map<string, number>();
    for (const item of this.items()) {
      if (item.status === 'PENDING') {
        pendingByTarget.set(item.targetPublicId, (pendingByTarget.get(item.targetPublicId) ?? 0) + 1);
      }
    }

    const groups: ContentReportGroup[] = [];
    const byTarget = new Map<string, ContentReportGroup>();
    for (const item of this.visibleItems()) {
      let group = byTarget.get(item.targetPublicId);
      if (!group) {
        group = {
          targetPublicId: item.targetPublicId,
          targetType: item.targetType,
          title: buildGroupTitle(item),
          reportedUser: item.reportedUser,
          reportCount: item.reportCount,
          pendingCount: pendingByTarget.get(item.targetPublicId) ?? 0,
          items: [],
        };
        byTarget.set(item.targetPublicId, group);
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups.sort(
      (a, b) => b.reportCount - a.reportCount || a.targetPublicId.localeCompare(b.targetPublicId),
    );
  });

  constructor() {
    void this.load();
  }

  async load(silent = false): Promise<void> {
    if (!silent) {
      this.loading.set(true);
    }
    this.error.set(null);
    try {
      this.items.set(await this.service.getQueue());
    } catch {
      this.error.set('No pudimos cargar las denuncias. Reintentá en unos segundos.');
    } finally {
      if (!silent) {
        this.loading.set(false);
      }
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

  openReportedPost(item: ContentReportQueueItem): void {
    if (item.targetType !== 'POST') return;
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/reports', item.targetPublicId]),
    );
    window.open(url, '_blank', 'noopener');
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
    this.confirmation.set({
      action: 'delete',
      item,
      label: 'Descartar denuncia',
      description: 'Vas a descartar esta denuncia. El reporte no se modifica y la denuncia pasa a "Descartados".',
    });
  }

  confirmAction(): void {
    const pending = this.confirmation();
    if (!pending) return;
    this.applyStatus(pending.item, 'DISMISSED');
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
    return targetType === 'POST' ? 'Publicación' : targetType === 'CHAT' ? 'Chat' : 'Perfil';
  }

  targetTypeBadgeClass(targetType: ContentReportTargetType): string {
    return targetType === 'POST' ? 'bg-[#12355B]' : targetType === 'CHAT' ? 'bg-[#1D6FA3]' : 'bg-[#17597f]';
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
    this.service
      .resolve(item.publicId, status, patch.suspensionReason ?? undefined)
      .then((result) => {
        if (status === 'APPROVED' && result.autoSuspended) {
          this.toastService.brand(
            `El usuario alcanzó 5 publicaciones aprobadas: se suspendió automáticamente y ${result.suspendedCount} ${result.suspendedCount === 1 ? 'denuncia pasó' : 'denuncias pasaron'} a Suspendidas.`,
          );
        } else if (status === 'APPROVED' && result.approvedCount > 0) {
          this.toastService.brand(
            'Todas las denuncias de esta publicación se pasaron a Aprobadas.',
          );
        } else if (status === 'SUSPENDED' && result.suspendedCount > 0) {
          const message =
            item.targetType === 'CHAT'
              ? 'Se suspendió el chat. Todas sus denuncias se pasaron a Suspendidas.'
              : 'Se suspendió al usuario. Todas las denuncias de sus publicaciones y perfil se pasaron a Suspendidas.';
          this.toastService.brand(message);
        }
      })
      .finally(() => {
        void this.load(true);
      });
  }
}
