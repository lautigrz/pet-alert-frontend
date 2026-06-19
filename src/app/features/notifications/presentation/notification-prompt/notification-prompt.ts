import { Component, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../application/notification.service';

const DISMISS_KEY = 'petfinder.notif-prompt-dismissed';

@Component({
  selector: 'app-notification-prompt',
  standalone: true,
  templateUrl: './notification-prompt.html',
})
export class NotificationPrompt {
  private readonly notifications = inject(NotificationService);
  private readonly dismissed = signal(localStorage.getItem(DISMISS_KEY) === '1');
  protected readonly busy = this.notifications.busy;

  protected readonly visible = computed(
    () =>
      this.notifications.isSupported() &&
      this.notifications.permission() === 'default' &&
      !this.dismissed(),
  );

  protected async activate(): Promise<void> {
    await this.notifications.enable();
  }

  protected dismiss(): void {
    localStorage.setItem(DISMISS_KEY, '1');
    this.dismissed.set(true);
  }
}
