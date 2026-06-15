import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-pet-icon',
  standalone: true,
  imports: [NgStyle],
  host: { class: 'inline-block' },
  template: `<span class="block w-full h-full bg-current" [ngStyle]="maskStyle"></span>`,
})
export class PetIconComponent {
  @Input({ required: true }) name = '';

  get maskStyle() {
    const mask = `url(/${this.name}.svg) center / contain no-repeat`;
    return { '-webkit-mask': mask, mask };
  }
}
