import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatchService } from '../../application/match.service';
import { ReportService } from '../../application/report.service';
import { ReportDetail } from '../../infrastructure/report.http';
import { Match } from '../../domain/match.model';
import { MatchCardComponent } from '../components/match-card/match-card';
import { MatchDetailModalComponent } from '../components/match-detail-modal/match-detail-modal';
import { ChatsService } from '../../../chats/application/chats.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { PetIconComponent } from '../../../../shared/component/pet-icon/pet-icon.component';
import { SeenMatchesStore } from '../../application/seen-matches.store';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [RouterLink, MatchCardComponent, MatchDetailModalComponent, PetIconComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './matches.html',
})
export class MatchesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly reportService = inject(ReportService);
  private readonly chatsService = inject(ChatsService);
  private readonly toastService = inject(ToastService);
  private readonly seenMatchesStore = inject(SeenMatchesStore);
  private readonly destroyRef = inject(DestroyRef);

  report = signal<ReportDetail | null>(null);
  matches = signal<Match[]>([]);
  nuevos = signal<Set<string>>(new Set());
  loading = signal(true);
  error = signal<string | null>(null);

  selectedMatch = signal<Match | null>(null);
  selectedDetail = signal<ReportDetail | null>(null);
  detailLoading = signal(false);

  private readonly tooltipHover = signal(false);
  private readonly tooltipClick = signal(false);
  readonly tooltipOpen = computed(() => this.tooltipHover() || this.tooltipClick());

  readonly reportTitle = computed(() => {
    const r = this.report();
    if (!r) return '';
    return (
      r.details.name ||
      r.details.petName ||
      (r.type === 'LOST' ? 'Mascota perdida' : 'Avistamiento')
    );
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const publicId = params.get('publicId');
      if (publicId) void this.cargar(publicId);
    });
  }

  private async cargar(publicId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { report, matches } = await this.matchService.getReportMatches(publicId);
      await this.seenMatchesStore.ensureLoaded();
      this.report.set(report);
      this.matches.set(matches);
      this.nuevos.set(
        new Set(
          matches
            .filter((match) => this.seenMatchesStore.isNew(match.matchPublicId))
            .map((match) => match.matchPublicId),
        ),
      );
    } catch {
      this.error.set('No se pudieron cargar las coincidencias');
    } finally {
      this.loading.set(false);
    }
  }

  toggleTooltip(event: Event): void {
    event.stopPropagation();
    this.tooltipClick.update((open) => !open);
  }

  onTooltipPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.tooltipHover.set(true);
  }

  onTooltipPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.tooltipHover.set(false);
  }

  @HostListener('document:click')
  closeTooltip(): void {
    this.tooltipClick.set(false);
  }

  marcarVista(match: Match): void {
    void this.seenMatchesStore.markSeen(match.matchPublicId);
    this.nuevos.update((set) => {
      const next = new Set(set);
      next.delete(match.matchPublicId);
      return next;
    });
  }

  async openDetail(match: Match): Promise<void> {
    this.marcarVista(match);
    this.selectedMatch.set(match);
    this.selectedDetail.set(null);
    this.detailLoading.set(true);
    try {
      this.selectedDetail.set(await this.reportService.getReportByPublicId(match.reportPublicId));
    } catch {
      this.selectedDetail.set(null);
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail(): void {
    this.selectedMatch.set(null);
    this.selectedDetail.set(null);
  }

  verReporte(match: Match): void {
    this.closeDetail();
    void this.router.navigate(['/reports', match.reportPublicId]);
  }

  async openChat(match: Match): Promise<void> {
    this.marcarVista(match);
    if (!match.userPublicId) return;
    try {
      const conversationId = await this.chatsService.getOrCreateConversation(match.userPublicId);
      this.router.navigate(['/chats'], { queryParams: { conversation: conversationId } });
    } catch {
      this.toastService.error('No se pudo abrir el chat');
    }
  }
}
