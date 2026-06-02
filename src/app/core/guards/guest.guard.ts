import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorage } from '../../features/auth/infrastructure/token.storage';

export const guestGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorage);
  const router = inject(Router);
  const tokens = tokenStorage.read();
  if (tokens?.accessToken) {
    router.navigateByUrl('/home');
    return false;
  }
  return true;
};
