import { Route } from '@angular/router';

import { authGuard, publicOnlyGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./main.page').then((m) => m.MainPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' },
];
