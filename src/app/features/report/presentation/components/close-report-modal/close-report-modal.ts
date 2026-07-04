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
    { label: 'Mi mascota se reunió conmigo', descripcion: '¡La encontraste! Se cierra como reencuentro.', resolved: true },
    { label: 'Dejo de buscar por ahora', descripcion: 'Vas a pausar la búsqueda de tu mascota.', resolved: false },
    { label: 'La publicación tenía un error', descripcion: 'Se publicó con datos incorrectos.', resolved: false },
    { label: 'Otro motivo', descripcion: 'Cerrás el reporte por otra razón.', resolved: false },
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
