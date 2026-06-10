import { Component, HostListener, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportDetail } from '../../../infrastructure/report.http';

@Component({
  selector: 'app-report-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-gallery.html',
})
export class ReportGalleryComponent {
  report = input.required<ReportDetail>();

  imagenes = computed(() => this.report().details.images.map((i) => i.url));
  indiceActual = signal(0);
  imagenPrincipal = computed(() => this.imagenes()[this.indiceActual()] ?? null);

  modalAbierto = signal(false);
  modalIndex = signal(0);
  imagenModal = computed(() => this.imagenes()[this.modalIndex()] ?? null);

  seleccionarImagen(index: number): void {
    this.indiceActual.set(index);
  }

  abrirModal(): void {
    this.modalIndex.set(this.indiceActual());
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cerrarModal();
  }

  siguiente(): void {
    const total = this.imagenes().length;
    if (total) this.modalIndex.update((i) => (i + 1) % total);
  }

  anterior(): void {
    const total = this.imagenes().length;
    if (total) this.modalIndex.update((i) => (i - 1 + total) % total);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.modalAbierto()) return;
    if (event.key === 'ArrowRight') this.siguiente();
    else if (event.key === 'ArrowLeft') this.anterior();
    else if (event.key === 'Escape') this.cerrarModal();
  }
}
