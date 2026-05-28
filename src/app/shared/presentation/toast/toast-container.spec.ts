import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToastContainer } from './toast-container';
import { ToastService } from '../../application/toast.service';

describe('ToastContainer', () => {
  let container: ToastContainer;
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ToastContainer] });
    const fixture = TestBed.createComponent(ToastContainer);
    container = fixture.componentInstance;
    service = TestBed.inject(ToastService);
  });

  it('reads the toast list from the service', () => {
    // Given un toast en el service
    service.success('hola');

    // Then el container lo expone
    expect(container.toasts()).toHaveLength(1);
    expect(container.toasts()[0]!.message).toBe('hola');
  });

  it('returns the right classes for each kind', () => {
    // Then las clases coinciden con la decision visual del proyecto
    expect(container.classFor('success')).toContain('emerald');
    expect(container.classFor('error')).toContain('red');
    expect(container.classFor('info')).toContain('slate');
  });

  it('forwards dismiss to the service', () => {
    // Given un toast cargado
    service.success('aviso');
    const id = service.toasts()[0]!.id;

    // When pido al container que lo cierre
    container.dismiss(id);

    // Then queda marcado como leaving por el service
    expect(service.toasts()[0]!.leaving).toBe(true);
  });
});
