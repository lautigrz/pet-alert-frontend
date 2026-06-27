import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportModalComponent, TipoDenuncia } from './report-modal';
import { ContentReportService } from '../../../features/content-report/application/content-report.service';
import { ContentReportReason } from '../../../features/content-report/domain/content-report.models';

describe('ReportModalComponent', () => {
  let component: ReportModalComponent;
  let fixture: ComponentFixture<ReportModalComponent>;
  let contentReportService: { report: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    contentReportService = {
      report: vi.fn().mockResolvedValue({ publicId: 'cr-1', autoFlagged: false }),
    };

    TestBed.configureTestingModule({
      imports: [ReportModalComponent],
      providers: [
        { provide: ContentReportService, useValue: contentReportService },
      ],
    });

    fixture = TestBed.createComponent(ReportModalComponent);
    component = fixture.componentInstance;
  });

  function setInputs(tipo: TipoDenuncia, targetPublicId: string): void {
    fixture.componentRef.setInput('tipo', tipo);
    fixture.componentRef.setInput('targetPublicId', targetPublicId);
    fixture.detectChanges();
  }

  it('envía la denuncia de chat con el motivo seleccionado y muestra el éxito', async () => {
    setInputs('chat', 'conv-uuid');
    component.motivoSeleccionado.set(1);
    component.detalle.set('Me pidió dinero');

    await component.enviar();

    expect(contentReportService.report).toHaveBeenCalledWith({
      targetType: 'CHAT',
      targetPublicId: 'conv-uuid',
      reason: ContentReportReason.FRAUD_OR_SCAM,
      description: 'Me pidió dinero',
    });
    expect(component.enviada()).toBe(true);
    expect(component.error()).toBeNull();
  });

  it('mapea el tipo "reporte" al target POST con su primer motivo', async () => {
    setInputs('reporte', 'report-uuid');

    await component.enviar();

    const [payload] = contentReportService.report.mock.calls[0];
    expect(payload.targetType).toBe('POST');
    expect(payload.reason).toBe(ContentReportReason.FALSE_INFORMATION);
  });

  it('envía description undefined cuando el detalle está vacío', async () => {
    setInputs('chat', 'conv-uuid');
    component.detalle.set('   ');

    await component.enviar();

    const [payload] = contentReportService.report.mock.calls[0];
    expect(payload.description).toBeUndefined();
  });

  it('muestra el error y no marca enviada si el service falla', async () => {
    contentReportService.report.mockRejectedValue(
      new Error('Ya enviaste una denuncia para este contenido.'),
    );
    setInputs('chat', 'conv-uuid');

    await component.enviar();

    expect(component.enviada()).toBe(false);
    expect(component.error()).toBe('Ya enviaste una denuncia para este contenido.');
  });

  it('no envía dos veces si ya está enviando', async () => {
    setInputs('chat', 'conv-uuid');
    component.enviando.set(true);

    await component.enviar();

    expect(contentReportService.report).not.toHaveBeenCalled();
  });

  it('emite cerrar al cerrar el modal', () => {
    setInputs('chat', 'conv-uuid');
    const cerrarSpy = vi.fn();
    component.cerrar.subscribe(cerrarSpy);

    component.cerrarModal();

    expect(cerrarSpy).toHaveBeenCalled();
  });
});
