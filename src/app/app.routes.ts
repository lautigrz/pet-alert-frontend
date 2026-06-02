import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { verifiedGuard } from './core/guards/verified.guard';
import { wizardStepGuard } from './features/report/guards/wizard-step.guard';
import { AppShellComponent } from './shared/component/app-shell/app-shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/presentation/register-page/register-page').then(
        (m) => m.RegisterPage,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/presentation/login-page/login-page').then(
        (m) => m.LoginPage,
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import(
        './features/auth/presentation/verify-email-page/verify-email-page'
      ).then((m) => m.VerifyEmailPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(
        './features/auth/presentation/forgot-password-page/forgot-password-page'
      ).then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import(
        './features/auth/presentation/reset-password-page/reset-password-page'
      ).then((m) => m.ResetPasswordPage),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home-map/home-map').then((m) => m.HomeMapComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import(
            './features/reportes/pages/lista-reportes/lista-reportes.component'
          ).then((m) => m.ListaReportesComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import(
            './features/profile/presentation/profile-page/profile-page'
          ).then((m) => m.ProfilePage),
      },
      {
        path: 'profile/edit',
        loadComponent: () =>
          import(
            './features/profile/presentation/edit-profile-page/edit-profile-page'
          ).then((m) => m.EditProfilePage),
      },
      {
        path: 'detalle-reporte',
        loadComponent: () =>
          import(
            './features/reportes/pages/detalle-reporte/detalle-reporte.component'
          ).then((m) => m.DetalleReporteComponent),
      },
      {
        path: 'report',
        children: [
          {
            path: 'type',
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-2/report-type-page/report-type-page').then(
                (m) => m.ReportTypePage,
              ),
          },
          {
            path: 'found-type',
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-2/report-found-type-page/report-found-type-page').then(
                (m) => m.ReportFoundTypePage,
              ),
          },
          {
            path: 'data',
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-2/report-data-page/report-data-page').then(
                (m) => m.ReportDataPage,
              ),
          },
          {
            path: 'lost-data',
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-1/lost-data-page/lost-data-page').then(
                (m) => m.LostDataPage,
              ),
          },
          {
            path: 'location',
            canActivate: [wizardStepGuard((r) => !!r.sightingDetails || !!r.pet?.name)],
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-2/report-loc-page/report-loc-page').then(
                (m) => m.ReportLocationPage,
              ),
          },
          {
            path: 'review',
            canActivate: [wizardStepGuard((r) => (!!r.sightingDetails || !!r.pet?.name) && !!r.location?.address)],
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-2/report-rev-page/report-rev-page').then(
                (m) => m.ReportRevPage,
              ),
          },
          {
            path: 'confirm',
            canActivate: [
              wizardStepGuard((r) => !!r.sightingDetails && !!r.location?.address),
              verifiedGuard,
            ],
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-2/report-confirm-page/report-confirm-page').then(
                (m) => m.ReportConfirmPage,
              ),
          },
          {
            path: 'lost-confirm',
            canActivate: [
              wizardStepGuard((r) => r.type === 'lost' && !!r.pet?.name && !!r.location?.address),
              verifiedGuard,
            ],
            loadComponent: () =>
              import('./features/report/presentation/crear-reporte-1/lost-confirm-page/lost-confirm-page').then(
                (m) => m.LostConfirmPage,
              ),
          },
        ],
      },
    ],
  },
];
