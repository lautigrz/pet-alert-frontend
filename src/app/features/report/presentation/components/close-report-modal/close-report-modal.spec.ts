import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CloseReportModalComponent } from './close-report-modal';

describe('CloseReportModalComponent', () => {
  let component: CloseReportModalComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CloseReportModalComponent] });
    component = TestBed.createComponent(CloseReportModalComponent).componentInstance;
  });

  it('emite resolved=true y la fecha de cierre al confirmar "¡La mascota volvió a casa!"', () => {
    let emitido: { resolved: boolean; resolvedAt: string } | undefined;
    component.confirmar.subscribe((v) => (emitido = v));

    component.seleccionar(0);
    component.onConfirmar();

    expect(emitido?.resolved).toBe(true);
    expect(emitido?.resolvedAt).toBe(component.today);
  });

  it('emite resolved=false para los otros motivos', () => {
    let emitido: { resolved: boolean; resolvedAt: string } | undefined;
    component.confirmar.subscribe((v) => (emitido = v));

    component.seleccionar(1);
    component.onConfirmar();

    expect(emitido?.resolved).toBe(false);
  });

  it('no emite si no hay motivo seleccionado', () => {
    let emitido = false;
    component.confirmar.subscribe(() => (emitido = true));

    component.onConfirmar();

    expect(emitido).toBe(false);
  });
});
