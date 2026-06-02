import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TokenStorage } from '../../features/auth/infrastructure/token.storage';
import { ToastService } from '../../shared/application/toast.service';

// Bloquea la activacion si la cuenta no esta verificada (toast + se queda donde esta).
export const verifiedGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorage);
  const toast = inject(ToastService);

  const tokens = tokenStorage.read();
  if (tokens && isTokenVerified(tokens.accessToken)) {
    return true;
  }

  toast.error('Tenés que verificar tu cuenta para publicar un reporte.');
  return false;
};

function isTokenVerified(accessToken: string): boolean {
  const payload = accessToken.split('.')[1];
  if (!payload) return false;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).isVerified === true;
  } catch {
    return false;
  }
}
