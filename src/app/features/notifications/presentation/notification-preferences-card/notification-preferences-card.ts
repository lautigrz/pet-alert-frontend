import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NotificationPreferencesService } from '../../application/notification-preferences.service';
import { ToastService } from '../../../../shared/application/toast.service';

@Component({
  selector: 'app-notification-preferences-card',
  standalone: true,
  templateUrl: './notification-preferences-card.html',
})
export class NotificationPreferencesCard implements OnInit {
  private readonly preferencesService = inject(NotificationPreferencesService);
  private readonly toast = inject(ToastService);

  readonly loading = this.preferencesService.loading;
  readonly saving = this.preferencesService.saving;

  readonly serverError = signal<string | null>(null);

  readonly notificationRadius = signal(5);
  readonly lostReportsEnabled = signal(true);
  readonly sightingReportsEnabled = signal(true);
  readonly matchesEnabled = signal(true);
  readonly mutedUntil = signal<string | null>(null);

  readonly isPaused = computed(() => {
    const value = this.mutedUntil();

    if (!value) return false;

    return new Date(value).getTime() > Date.now();
  });

  readonly pausedText = computed(() => {
    const value = this.mutedUntil();

    if (!value || !this.isPaused()) {
      return 'Notificaciones activas';
    }

    return `Pausadas hasta ${new Date(value).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  });

  async ngOnInit(): Promise<void> {
    await this.loadPreferences();
  }

  private async loadPreferences(): Promise<void> {
    this.serverError.set(null);

    try {
      const preferences = await this.preferencesService.load();

      this.notificationRadius.set(preferences.notificationRadius);
      this.lostReportsEnabled.set(preferences.lostReportsEnabled);
      this.sightingReportsEnabled.set(preferences.sightingReportsEnabled);
      this.matchesEnabled.set(preferences.matchesEnabled);
      this.mutedUntil.set(preferences.mutedUntil);
    } catch (error) {
      this.serverError.set(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las preferencias',
      );
    }
  }

  onRadiusChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.notificationRadius.set(Number(input.value));
  }

  toggleSightings(): void {
    this.sightingReportsEnabled.update((value) => !value);
  }

  toggleMatches(): void {
    this.matchesEnabled.update((value) => !value);
  }

  pauseForHours(hours: number): void {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    this.mutedUntil.set(date.toISOString());
  }

  clearPause(): void {
    this.mutedUntil.set(null);
  }

  async save(): Promise<void> {
    this.serverError.set(null);

    try {
      const updated = await this.preferencesService.update({
        notificationRadius: this.notificationRadius(),
        lostReportsEnabled: this.lostReportsEnabled(),
        sightingReportsEnabled: this.sightingReportsEnabled(),
        matchesEnabled: this.matchesEnabled(),
        mutedUntil: this.mutedUntil(),
      });

      this.notificationRadius.set(updated.notificationRadius);
      this.lostReportsEnabled.set(updated.lostReportsEnabled);
      this.sightingReportsEnabled.set(updated.sightingReportsEnabled);
      this.matchesEnabled.set(updated.matchesEnabled);
      this.mutedUntil.set(updated.mutedUntil);

      this.toast.success('Preferencias de notificación actualizadas');
    } catch (error) {
      this.serverError.set(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar las preferencias',
      );
    }
  }
}
