import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ReportDetail } from '../../../infrastructure/report.http';
import { PetIconComponent } from '../../../../../shared/component/pet-icon/pet-icon.component';
import { ChatsService } from '../../../../chats/application/chats.service';
import { ToastService } from '../../../../../shared/application/toast.service';

@Component({
  selector: 'app-report-contact',
  standalone: true,
  imports: [PetIconComponent],
  templateUrl: './report-contact.html',
})
export class ReportContactComponent {
  private readonly router = inject(Router);
  private readonly chatsService = inject(ChatsService);
  private readonly toastService = inject(ToastService);

  report = input.required<ReportDetail>();
  esPropio = input(false);

  userPublicId = computed(() => this.report().user);
  username = computed(() => this.report().user.username);
  imagenUsuario = computed(() => this.report().user.photoUrl || 'https://i.pinimg.com/474x/a8/da/22/a8da222be70a71e7858bf752065d5cc3.jpg');

  goToMatches(): void {
    this.router.navigate(['/reports', this.report().publicId, 'matches']);
  }

  async enviarMensaje(): Promise<void> {
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
