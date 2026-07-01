import { Component, inject } from '@angular/core';
import { ToastService } from '../../application/toast.service';
import { ToastKind } from '../../domain/toast.types';

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-slate-50 border-slate-200 text-slate-800',
  brand: 'bg-[#1D6FA3]/10 border-[#1D6FA3]/40 text-[#12355B]',
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  classFor(kind: ToastKind): string {
    return KIND_CLASSES[kind];
  }
}
