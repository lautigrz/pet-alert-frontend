import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('show', () => {
    it('adds a success toast to the queue', () => {
      // When llamo a success
      service.success('Te enviamos el correo');

      // Then el toast esta en la lista
      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]!.kind).toBe('success');
      expect(toasts[0]!.message).toBe('Te enviamos el correo');
    });

    it('adds an error toast', () => {
      // When llamo a error
      service.error('Algo salio mal');

      // Then queda en la lista con kind error
      expect(service.toasts()[0]!.kind).toBe('error');
    });

    it('adds an info toast', () => {
      // When llamo a info
      service.info('Recordatorio');

      // Then queda en la lista con kind info
      expect(service.toasts()[0]!.kind).toBe('info');
    });

    it('assigns a unique id to each toast', () => {
      // When agrego varios
      service.success('uno');
      service.error('dos');

      // Then los ids son distintos
      const [a, b] = service.toasts();
      expect(a!.id).not.toBe(b!.id);
    });
  });

  describe('auto dismiss', () => {
    it('auto-removes a toast after its duration', () => {
      // Given un toast con duracion default (5000ms)
      service.success('chau');
      expect(service.toasts()).toHaveLength(1);

      // When pasa el tiempo de la duracion + animacion de salida
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(200);

      // Then el toast se fue
      expect(service.toasts()).toHaveLength(0);
    });

    it('honors a custom duration', () => {
      // Given un toast con duracion custom
      service.info('rapido', 1000);

      // When pasa el tiempo custom + animacion
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(200);

      // Then ya no esta
      expect(service.toasts()).toHaveLength(0);
    });
  });

  describe('dismiss manual', () => {
    it('marks the toast as leaving immediately and removes it after the animation', () => {
      // Given un toast en la lista
      service.success('aviso');
      const id = service.toasts()[0]!.id;

      // When llamo a dismiss
      service.dismiss(id);

      // Then queda marcado como leaving (la animacion arranca)
      expect(service.toasts()[0]!.leaving).toBe(true);

      // And after the leave animation, se va
      vi.advanceTimersByTime(200);
      expect(service.toasts()).toHaveLength(0);
    });

    it('does not crash when dismissing an unknown id', () => {
      // When llamo dismiss con id que no existe
      expect(() => service.dismiss('no-existe')).not.toThrow();
    });
  });
});
