import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  templateUrl: './info-tooltip.component.html',
})
export class InfoTooltipComponent {
  tooltipTitle  = input.required<string>();
  ariaLabel = input<string>('Más información');
  align = input<'left' | 'right' | 'center'>('left');

  readonly positionClasses = computed(() => {
    switch (this.align()) {
      case 'right':
        return 'sm:left-auto sm:right-0 sm:translate-x-0';
      case 'center':
        return 'sm:left-1/2 sm:-translate-x-1/2';
      default:
        return 'sm:left-0 sm:translate-x-0';
    }
  });

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