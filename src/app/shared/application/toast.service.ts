import { Injectable, signal } from '@angular/core';
import { Toast, ToastKind } from '../domain/toast.types';

const DEFAULT_DURATION_MS = 5000;
const LEAVE_ANIMATION_MS = 200;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, durationMs?: number): void {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.show('error', message, durationMs);
  }

  info(message: string, durationMs?: number): void {
    this.show('info', message, durationMs);
  }

  brand(message: string, durationMs?: number): void {
    this.show('brand', message, durationMs);
  }

  award(message: string, durationMs?: number): void {
    this.show('award', message, durationMs);
  }

  dismiss(id: string): void {
    this._toasts.update((arr) =>
      arr.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      this._toasts.update((arr) => arr.filter((t) => t.id !== id));
    }, LEAVE_ANIMATION_MS);
  }

  private show(kind: ToastKind, message: string, durationMs?: number): void {
    const id = crypto.randomUUID();
    const duration = durationMs ?? DEFAULT_DURATION_MS;
    const toast: Toast = { id, message, kind, durationMs: duration };
    this._toasts.update((arr) => [...arr, toast]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
