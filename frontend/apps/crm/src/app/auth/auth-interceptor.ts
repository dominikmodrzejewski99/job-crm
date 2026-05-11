import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Adds {@code Authorization: Bearer <token>} to every outgoing request when
 * the user has a token, and bumps unauthenticated users to /login on 401.
 * Auth endpoints themselves are skipped so a fresh login attempt doesn't
 * carry a stale token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint =
    req.url.includes('/api/v1/auth/login') ||
    req.url.includes('/api/v1/auth/register');

  const token = auth.token();
  const authed = !isAuthEndpoint && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthEndpoint) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
