import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-achievement-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:inline-flex;align-items:center;justify-content:center}'],
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="h-full w-full" aria-hidden="true">
      @switch (code) {
        @case ('FIRST_RESCUE') {
          <circle cx="5.6" cy="12.4" r="1.9" />
          <circle cx="9.6" cy="7.7" r="2" />
          <circle cx="14.4" cy="7.7" r="2" />
          <circle cx="18.4" cy="12.4" r="1.9" />
          <path d="M12 12.6c-2.8 0-5.1 2.3-5.1 4.7 0 1.9 1.5 2.8 3.2 2.8 1 0 1.2-.35 1.9-.35s.9.35 1.9.35c1.7 0 3.2-.9 3.2-2.8 0-2.4-2.3-4.7-5.1-4.7z" />
        }
        @case ('SOLIDARY_NEIGHBOR') {
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        }
        @case ('URBAN_EXPLORER') {
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('GIANT_HEART') {
          <path d="M12 20.3 4.2 12.6a4.6 4.6 0 0 1 6.5-6.5l1.3 1.3 1.3-1.3a4.6 4.6 0 0 1 6.5 6.5L12 20.3z" />
        }
        @case ('COMMUNITY_BOND') {
          <path d="M9.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
          <path d="M14.5 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3" />
        }
        @case ('FREQUENT_SIGHTER') {
          <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        }
        @case ('WEEKLY_STREAK') {
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        }
        @case ('CERTIFIED_CAREGIVER') {
          <path d="M12 3.5 5.5 6v5c0 4.2 2.8 6.9 6.5 8.2 3.7-1.3 6.5-4 6.5-8.2V6L12 3.5z" />
          <path d="M9.2 11.8 11.2 13.8 15 10" />
        }
        @default {
          <path d="M12 4l2.3 4.9 5.2.5-3.9 3.6 1.1 5.3L12 15.9 7.2 18.9l1.1-5.3L4.4 9.9l5.2-.5L12 4z" />
        }
      }
    </svg>
  `,
})
export class AchievementIconComponent {
  @Input({ required: true }) code!: string;
}
