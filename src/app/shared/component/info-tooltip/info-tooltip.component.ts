import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  templateUrl: './info-tooltip.component.html',
})
export class InfoTooltipComponent {
  tooltipTitle  = input.required<string>();
  ariaLabel = input<string>('Más información');

  isOpen = signal(false);

  toggleTooltip(event: Event): void {
    event.stopPropagation();
    this.isOpen.update((value) => !value);
  }

  openTooltip(): void {
    this.isOpen.set(true);
  }

  closeTooltip(): void {
    this.isOpen.set(false);
  }
}