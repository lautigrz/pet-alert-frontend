export type ToastKind = 'success' | 'error' | 'info' | 'brand';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  durationMs: number;
  leaving?: boolean;
}
