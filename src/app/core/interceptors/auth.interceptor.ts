import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/application/auth.service';
import { TokenStorage } from '../../features/auth/infrastructure/token.storage';

const PUBLIC_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout', '/users'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorage);
  const authenticated = withAccessToken(req, tokenStorage);

  if (isPublicRequest(req.url)) return next(authenticated);

  const authService = inject(AuthService);
  const router = inject(Router);

  return next(authenticated).pipe(
    catchError((error) => {
      if (!isUnauthorized(error)) return throwError(() => error);
      return retryWithFreshToken(req, next, authService, tokenStorage, router);
    }),
  );
};

function isPublicRequest(url: string): boolean {
  return PUBLIC_PATHS.some((path) => url.endsWith(path));
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function withAccessToken(req: HttpRequest<unknown>, tokenStorage: TokenStorage) {
  const tokens = tokenStorage.read();
  return tokens ? withBearer(req, tokens.accessToken) : req;
}

function withBearer(req: HttpRequest<unknown>, accessToken: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
}

function retryWithFreshToken(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  tokenStorage: TokenStorage,
  router: Router,
) {
  return from(authService.refreshSession()).pipe(
    switchMap((accessToken) => next(withBearer(req, accessToken))),
    catchError((error) => {
      tokenStorage.clear();
      router.navigate(['/login']);
      return throwError(() => error);
    }),
  );
}
