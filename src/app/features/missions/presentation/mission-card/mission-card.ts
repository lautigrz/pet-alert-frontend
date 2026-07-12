import { Component, Input, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MissionCardOutput } from '../../infrastructure/models/mission.model';
import { MissionStatusMapper } from '../mission-status.mapper';

@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'block' },
  templateUrl: './mission-card.html',
})
export class MissionCardComponent {
  @Input({ required: true }) set mission(value: MissionCardOutput) {
    this.data.set(value);
  }

  readonly data = signal<MissionCardOutput | null>(null);

  readonly image = computed(() => {
    const mission = this.data();
    if (!mission) return null;
    return mission.report.photoUrl ?? mission.report.petDetails?.photoUrl ?? null;
  });

  readonly title = computed(() => {
    const mission = this.data();
    if (!mission) return '';
    return (
      mission.report.title?.trim() ||
      mission.report.petDetails?.name?.trim() ||
      'Búsqueda de mascota'
    );
  });

  readonly address = computed(() => {
    const address = this.data()?.report.location.address ?? '';
    const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
    return parts.slice(0, 3).join(', ') || 'Sin ubicación';
  });

  readonly statusLabel = computed(() => MissionStatusMapper.getLabel(this.data()?.status));

  readonly statusColor = computed(() =>
    MissionStatusMapper.isClosed(this.data()?.status) ? '#94A3B8' : '#E8842E',
  );

  readonly radiusKm = computed(() => {
    const km = (this.data()?.searchArea.radius ?? 0) / 1000;
    return Number.isInteger(km) ? `${km}` : km.toFixed(1);
  });

  readonly elapsed = computed(() => {
    const mission = this.data();
    if (!mission) return '';
    return this.timeAgo(mission.createdAt);
  });

  private timeAgo(date: Date | string): string {
    const created = new Date(date).getTime();
    const hours = Math.floor((Date.now() - created) / (1000 * 60 * 60));
    if (hours < 1) return 'Hace instantes';
    if (hours < 24) return `Hace ${hours}hs`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  }
}
