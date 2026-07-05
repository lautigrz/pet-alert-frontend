import { Component, input, output, signal } from '@angular/core';

interface CloseMotivo {
  label: string;
  descripcion: string;
  resolved: boolean;
}

@Component({
  selector: 'app-close-report-modal',
  standalone: true,
  templateUrl: './close-report-modal.html',
})
export class CloseReportModalComponent {
  readonly enviando = input(false);
  readonly cerrar = output<void>();
  readonly confirmar = output<boolean>();

  readonly motivos: CloseMotivo[] = [
    { label: '¡La mascota volvió a casa! 🧡', descripcion: 'El caso se resolvió', resolved: true },
    { label: 'Cierro la publicación por ahora', descripcion: 'Por ahora no vas a seguir con esta publicación', resolved: false },
    { label: 'La publicación tenía un error', descripcion: 'Se publicó con datos incorrectos', resolved: false },
    { label: 'Otro motivo', descripcion: 'Cerrás el reporte por otra razón', resolved: false },
  ];

  readonly motivoSeleccionado = signal<number | null>(null);

  seleccionar(i: number): void {
    this.motivoSeleccionado.set(i);
  }

  onConfirmar(): void {
    const i = this.motivoSeleccionado();
    if (i === null) return;
    this.confirmar.emit(this.motivos[i].resolved);
  }
}
