import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/presentation/register-page/register-page').then(
        (m) => m.RegisterPage,
      ),
  },
  {
    path: 'verify-email-sent',
    loadComponent: () =>
      import('./features/auth/presentation/verify-email-sent-page/verify-email-sent-page').then(
        (m) => m.VerifyEmailSentPage,
      ),
  },
];
