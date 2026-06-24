import { Component, OnDestroy, computed, input, output, signal } from '@angular/core';

export type TipoDenuncia = 'chat' | 'reporte';

interface Motivo {
  label: string;
  descripcion: string;
}

interface DenunciaConfig {
  titulo: string;
  intro: string;
  motivos: Motivo[];
}

const CONFIG: Record<TipoDenuncia, DenunciaConfig> = {
  chat: {
    titulo: 'Denunciar chat',
    intro: 'Contanos por qué lo denunciás. Tu denuncia nos ayuda a mantener la comunidad segura.',
    motivos: [
      { label: 'Comportamiento sospechoso', descripcion: 'Mensajes o actitud que generan desconfianza' },
      { label: 'Fraude o estafa', descripcion: 'Intento de engaño o pedido de dinero' },
      { label: 'Suplantación de identidad', descripcion: 'Se hace pasar por otra persona o perfil falso' },
      { label: 'Contenido inapropiado', descripcion: 'Mensajes o imágenes ofensivas' },
      { label: 'Datos personales expuestos', descripcion: 'Comparte información privada' },
      { label: 'Otro', descripcion: 'Contanos más en el detalle' },
    ],
  },
  reporte: {
    titulo: 'Denunciar reporte',
    intro: 'Contanos por qué lo denunciás. Tu denuncia nos ayuda a mantener la comunidad segura.',
    motivos: [
      { label: 'Información falsa o engañosa', descripcion: 'El reporte tiene datos incorrectos' },
      { label: 'Contenido inapropiado', descripcion: 'Imágenes o texto ofensivo' },
      { label: 'Spam o publicidad', descripcion: 'Contenido repetido o promocional' },
      { label: 'Reporte duplicado', descripcion: 'Ya existe un reporte igual' },
      { label: 'Otro', descripcion: 'Contanos más en el detalle' },
    ],
  },
};

@Component({
  selector: 'app-report-modal',
  standalone: true,
  templateUrl: './report-modal.html',
})
export class ReportModalComponent implements OnDestroy {
  readonly tipo = input.required<TipoDenuncia>();
  readonly cerrar = output<void>();

  readonly config = computed(() => CONFIG[this.tipo()]);
  readonly motivoSeleccionado = signal(0);
  readonly detalle = signal('');
  readonly enviada = signal(false);

  private autoCloseTimer?: ReturnType<typeof setTimeout>;

  enviar(): void {
    this.enviada.set(true);
    this.autoCloseTimer = setTimeout(() => this.cerrarModal(), 3000);
  }

  cerrarModal(): void {
    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
    this.cerrar.emit();
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
  }
}
