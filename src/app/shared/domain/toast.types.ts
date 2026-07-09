export type ToastKind = 'success' | 'error' | 'info' | 'brand' | 'award';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  durationMs: number;
  leaving?: boolean;
}
