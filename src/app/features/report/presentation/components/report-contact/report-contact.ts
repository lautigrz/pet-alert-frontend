import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ReportDetail } from '../../../infrastructure/report.http';
import { PetIconComponent } from '../../../../../shared/component/pet-icon/pet-icon.component';
import { ChatsService } from '../../../../chats/application/chats.service';
import { ToastService } from '../../../../../shared/application/toast.service';
import { AchievementIconComponent } from '../../../../profile/presentation/achievement-icon/achievement-icon.component';
import type { UserExperienceAchievement } from '../../../../profile/domain/profile.model';

@Component({
  selector: 'app-report-contact',
  standalone: true,
  imports: [PetIconComponent, AchievementIconComponent],
  templateUrl: './report-contact.html',
})
export class ReportContactComponent {
  private readonly router = inject(Router);
  private readonly chatsService = inject(ChatsService);
  private readonly toastService = inject(ToastService);

  private readonly meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  report = input.required<ReportDetail>();
  esPropio = input(false);
  userLevel = input<number | null>(null);
  topAchievement = input<UserExperienceAchievement | null>(null);
  achievementTooltip = input('');

  userPublicId = computed(() => this.report().user);
  username = computed(() => this.report().user.username);
  imagenUsuario = computed(() => this.report().user.photoUrl || 'https://i.pinimg.com/474x/a8/da/22/a8da222be70a71e7858bf752065d5cc3.jpg');

  miembroDesde = computed(() => {
    const fecha = this.report().user.createdAt;
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    return `Miembro desde ${this.meses[date.getMonth()]} ${date.getFullYear()}`;
  });

  goToMatches(): void {
    this.router.navigate(['/reports', this.report().publicId, 'matches']);
  }

  verPerfil(): void {
    if (this.esPropio()) return;
    this.router.navigate(['/users', this.report().user.publicId]);
  }

  async sendMessage(): Promise<void> {
    const targetPublicId = this.report().user.publicId;
    if (!targetPublicId) return;
    try {
      const conversationId = await this.chatsService.getOrCreateConversation(targetPublicId);
      this.router.navigate(['/chats'], { queryParams: { conversation: conversationId } });
    } catch {
      this.toastService.error('No se pudo abrir el chat');
    }
  }
}
