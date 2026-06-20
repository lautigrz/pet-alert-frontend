import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatchService } from '../../application/match.service';
import { ReportDetail } from '../../infrastructure/report.http';
import { Match } from '../../domain/match.model';
import { MatchCardComponent } from '../components/match-card/match-card';
import { ChatsService } from '../../../chats/application/chats.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { PetIconComponent } from '../../../../shared/component/pet-icon/pet-icon.component';
import { SeenMatchesStore } from '../../application/seen-matches.store';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [RouterLink, MatchCardComponent, PetIconComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './matches.html',
})
export class MatchesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly chatsService = inject(ChatsService);
  private readonly toastService = inject(ToastService);
  private readonly seenMatchesStore = inject(SeenMatchesStore);

  private viewedPublicId = '';

  report = signal<ReportDetail | null>(null);
  matches = signal<Match[]>([]);
  nuevos = signal<Set<string>>(new Set());
  loading = signal(true);
  error = signal<string | null>(null);

  readonly reportTitle = computed(() => {
    const r = this.report();
    if (!r) return '';
    return (
      r.details.name ||
      r.details.petName ||
      (r.type === 'LOST' ? 'Mascota perdida' : 'Avistamiento')
    );
  });

  async ngOnInit(): Promise<void> {
    const publicId = this.route.snapshot.paramMap.get('publicId')!;
    this.viewedPublicId = publicId;
    try {
      const { report, matches } = await this.matchService.getReportMatches(publicId);
      this.report.set(report);
      this.matches.set(matches);
      this.nuevos.set(
        new Set(
          matches
            .filter((match) => this.seenMatchesStore.isNew(publicId, match.reportPublicId))
            .map((match) => match.reportPublicId),
        ),
      );
    } catch {
      this.error.set('No se pudieron cargar las coincidencias');
    } finally {
      this.loading.set(false);
    }
  }

  marcarVista(match: Match): void {
    this.seenMatchesStore.markSeen(this.viewedPublicId, match.reportPublicId);
    this.nuevos.update((set) => {
      const next = new Set(set);
      next.delete(match.reportPublicId);
      return next;
    });
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
