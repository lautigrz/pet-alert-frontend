import { Component, OnDestroy, computed, inject, input, output, signal } from '@angular/core';
import { ContentReportService } from '../../../features/content-report/application/content-report.service';
import { ContentReportReason, ContentReportTargetType } from '../../../features/content-report/domain/content-report.models';

export type TipoDenuncia = 'chat' | 'reporte';

interface Motivo {
  label: string;
  descripcion: string;
  code: ContentReportReason;
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
      { label: 'Comportamiento sospechoso', descripcion: 'Mensajes o actitud que generan desconfianza', code: ContentReportReason.SUSPICIOUS_BEHAVIOR },
      { label: 'Fraude o estafa', descripcion: 'Intento de engaño o pedido de dinero', code: ContentReportReason.FRAUD_OR_SCAM },
      { label: 'Suplantación de identidad', descripcion: 'Se hace pasar por otra persona o perfil falso', code: ContentReportReason.IMPERSONATION },
      { label: 'Contenido inapropiado', descripcion: 'Mensajes o imágenes ofensivas', code: ContentReportReason.INAPPROPRIATE_CONTENT },
      { label: 'Datos personales expuestos', descripcion: 'Comparte información privada', code: ContentReportReason.PERSONAL_DATA_EXPOSED },
      { label: 'Otro', descripcion: 'Contanos más en el detalle', code: ContentReportReason.OTHER },
    ],
  },
  reporte: {
    titulo: 'Denunciar reporte',
    intro: 'Contanos por qué lo denunciás. Tu denuncia nos ayuda a mantener la comunidad segura.',
    motivos: [
      { label: 'Información falsa o engañosa', descripcion: 'El reporte tiene datos incorrectos', code: ContentReportReason.FALSE_INFORMATION },
      { label: 'Contenido inapropiado', descripcion: 'Imágenes o texto ofensivo', code: ContentReportReason.INAPPROPRIATE_CONTENT },
      { label: 'Spam o publicidad', descripcion: 'Contenido repetido o promocional', code: ContentReportReason.SPAM },
      { label: 'Reporte duplicado', descripcion: 'Ya existe un reporte igual', code: ContentReportReason.DUPLICATE_REPORT },
      { label: 'Otro', descripcion: 'Contanos más en el detalle', code: ContentReportReason.OTHER },
    ],
  },
};

const TARGET_TYPE_BY_TIPO: Record<TipoDenuncia, ContentReportTargetType> = {
  chat: 'CHAT',
  reporte: 'POST',
};

@Component({
  selector: 'app-report-modal',
  standalone: true,
  templateUrl: './report-modal.html',
})
export class ReportModalComponent implements OnDestroy {
  readonly tipo = input.required<TipoDenuncia>();
  readonly targetPublicId = input.required<string>();
  readonly cerrar = output<void>();

  private readonly contentReportService = inject(ContentReportService);

  readonly config = computed(() => CONFIG[this.tipo()]);
  readonly motivoSeleccionado = signal(0);
  readonly detalle = signal('');
  readonly enviada = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  private autoCloseTimer?: ReturnType<typeof setTimeout>;

  async enviar(): Promise<void> {
    if (this.enviando()) return;

    const motivo = this.config().motivos[this.motivoSeleccionado()];
    this.enviando.set(true);
    this.error.set(null);

    try {
      await this.contentReportService.report({
        targetType: TARGET_TYPE_BY_TIPO[this.tipo()],
        targetPublicId: this.targetPublicId(),
        reason: motivo.code,
        description: this.detalle().trim() || undefined,
      });
      this.enviada.set(true);
      this.autoCloseTimer = setTimeout(() => this.cerrarModal(), 3000);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos enviar la denuncia.');
    } finally {
      this.enviando.set(false);
    }
  }

  cerrarModal(): void {
    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
    this.cerrar.emit();
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
  }
}
