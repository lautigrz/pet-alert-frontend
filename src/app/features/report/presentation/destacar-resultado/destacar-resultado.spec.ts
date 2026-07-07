import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { DestacarResultadoPage } from './destacar-resultado';

function createComponent(publicId: string | null, data: Record<string, unknown>): DestacarResultadoPage {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [DestacarResultadoPage],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => publicId }, data } },
      },
    ],
  });

  return TestBed.createComponent(DestacarResultadoPage).componentInstance;
}

describe('DestacarResultadoPage', () => {
  it('lee el estado y el publicId de la ruta', () => {
    const component = createComponent('report-uuid-1', { estado: 'exito' });

    expect(component.estado).toBe('exito');
    expect(component.publicId).toBe('report-uuid-1');
  });

  it('usa pendiente por defecto si la ruta no trae estado', () => {
    const component = createComponent('report-uuid-1', {});

    expect(component.estado).toBe('pendiente');
  });

  it('usa publicId vacío si no está en la ruta', () => {
    const component = createComponent(null, { estado: 'error' });

    expect(component.publicId).toBe('');
    expect(component.estado).toBe('error');
  });
});
