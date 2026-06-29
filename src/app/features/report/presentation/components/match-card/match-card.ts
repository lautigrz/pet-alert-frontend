import { Component, computed, input, output } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';

import { Match } from '../../../domain/match.model';
import { PetIconComponent } from '../../../../../shared/component/pet-icon/pet-icon.component';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [PetIconComponent, DatePipe, NgClass],
  host: { class: 'block h-full' },
  templateUrl: './match-card.html',
})
export class MatchCardComponent {
  match = input.required<Match>();
  nueva = input(false);
  detail = output<Match>();

  readonly percentage = computed(() => `${Math.round(this.match().score * 100)}%`);

  onDetail(): void {
    this.detail.emit(this.match());
  }
}
