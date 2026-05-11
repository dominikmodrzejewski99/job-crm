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
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./pages/applications/applications.page').then((m) => m.ApplicationsPage),
      },
      {
        path: 'job-board',
        loadComponent: () =>
          import('./pages/job-board/job-board.page').then((m) => m.JobBoardPage),
      },
      {
        path: 'follow-up',
        loadComponent: () =>
          import('./pages/follow-up/follow-up.page').then((m) => m.FollowUpPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      { path: 'app',    pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'legacy', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
