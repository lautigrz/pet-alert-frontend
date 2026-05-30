import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenStorage } from '../../features/auth/infrastructure/token.storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorage);

  const tokens = tokenStorage.read();

  if (!tokens) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  return next(authenticatedRequest);
};
