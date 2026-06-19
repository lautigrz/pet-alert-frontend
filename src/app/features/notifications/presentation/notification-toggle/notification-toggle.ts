import { Component, computed, inject } from '@angular/core';
import { NotificationService } from '../../application/notification.service';

@Component({
  selector: 'app-notification-toggle',
  standalone: true,
  templateUrl: './notification-toggle.html',
})
export class NotificationToggle {
  private readonly notifications = inject(NotificationService);

  protected readonly supported = this.notifications.isSupported();
  protected readonly active = this.notifications.active;
  protected readonly busy = this.notifications.busy;
  protected readonly blocked = computed(() => this.notifications.permission() === 'denied');

  protected async toggle(): Promise<void> {
    if (this.active()) return this.notifications.disable();
    await this.notifications.enable();
  }
}
