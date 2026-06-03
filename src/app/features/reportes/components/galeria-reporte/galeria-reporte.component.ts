import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportDetail } from '../../../report/infrastructure/report.http';

@Component({
  selector: 'app-galeria-reporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria-reporte.component.html',
  styleUrls: ['./galeria-reporte.component.css']
})
export class GaleriaReporteComponent {
  report = input.required<ReportDetail>();

  imagenSeleccionada = signal<string | null>(null);

  imagenes = computed(() => this.report().details.images.map(i => i.url));
  imagenSeleccionadaIndex = signal(0);
  imagenPrincipal = computed(() => this.imagenes()[this.imagenSeleccionadaIndex()] ?? null);

  seleccionarImagen(url: string): void {
    const index = this.imagenes().indexOf(url);
    if (index !== -1) this.imagenSeleccionadaIndex.set(index);
  }

  abrirImagen(url: string): void {
    this.imagenSeleccionada.set(url);
  }

  cerrarImagen(): void {
    this.imagenSeleccionada.set(null);
  }
}