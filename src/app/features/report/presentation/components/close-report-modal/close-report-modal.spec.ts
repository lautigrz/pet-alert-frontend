import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CloseReportModalComponent } from './close-report-modal';

describe('CloseReportModalComponent', () => {
  let component: CloseReportModalComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CloseReportModalComponent] });
    component = TestBed.createComponent(CloseReportModalComponent).componentInstance;
  });

  it('emite resolved=true al confirmar "Mi mascota se reunió conmigo"', () => {
    let emitido: boolean | undefined;
    component.confirmar.subscribe((v) => (emitido = v));

    component.seleccionar(0);
    component.onConfirmar();

    expect(emitido).toBe(true);
  });

  it('emite resolved=false para los otros motivos', () => {
    let emitido: boolean | undefined;
    component.confirmar.subscribe((v) => (emitido = v));

    component.seleccionar(1);
    component.onConfirmar();

    expect(emitido).toBe(false);
  });

  it('no emite si no hay motivo seleccionado', () => {
    let emitido = false;
    component.confirmar.subscribe(() => (emitido = true));

    component.onConfirmar();

    expect(emitido).toBe(false);
  });
});
