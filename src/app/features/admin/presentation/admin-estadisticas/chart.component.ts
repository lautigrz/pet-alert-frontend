import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  host: { class: 'block h-full w-full' },
  template: '<canvas #canvas></canvas>',
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  readonly config = input.required<ChartConfiguration>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const config = this.config();
      if (!this.chart) return;
      this.chart.data = config.data;
      this.chart.options = config.options ?? {};
      this.chart.update();
    });
  }

  ngAfterViewInit(): void {
    this.chart = new Chart(this.canvasRef().nativeElement, this.config());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
