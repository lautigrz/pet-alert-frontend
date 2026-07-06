import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { verifiedGuard } from './core/guards/verified.guard';
import { wizardStepGuard } from './features/report/guards/wizard-step.guard';
import { adminGuard, adminGuestGuard } from './features/admin/guards/admin.guard';
import { AdminLayoutComponent } from './features/admin/presentation/admin-layout/admin-layout';
import { AppShellComponent } from './shared/component/app-shell/app-shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/presentation/register-page/register-page').then(
        (m) => m.RegisterPage,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
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
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './features/auth/presentation/forgot-password-page/forgot-password-page'
      ).then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import(
        './features/auth/presentation/reset-password-page/reset-password-page'
      ).then((m) => m.ResetPasswordPage),
  },

  {
    path: 'admin/login',
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./features/admin/presentation/admin-login/admin-login').then(
        (m) => m.AdminLoginPage,
      ),
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/presentation/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
    ],
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
        path: 'reports',
        loadComponent: () =>
          import(
            './features/report/presentation/report-list/report-list'
          ).then((m) => m.ReportListPage),
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
        path: 'users/:publicId',
        loadComponent: () =>
          import(
            './features/profile/presentation/public-profile-page/public-profile-page'
          ).then((m) => m.PublicProfilePage),
      },
      {
        path: 'chats',
        loadComponent: () =>
          import('./features/chats/presentation/chats-page/chats-page')
          .then(m => m.ChatsPage),
      },
      {
        path: 'reports/:publicId',
        loadComponent: () =>
          import(
            './features/report/presentation/report-detail/report-detail'
          ).then((m) => m.ReportDetailPage),
      },
      {
        path: 'reports/:publicId/matches',
        loadComponent: () =>
          import(
            './features/report/presentation/matches/matches'
          ).then((m) => m.MatchesPage),
      },
      {
        path: 'reports/:publicId/destacar/exito',
        data: { estado: 'exito' },
        loadComponent: () =>
          import(
            './features/report/presentation/destacar-resultado/destacar-resultado'
          ).then((m) => m.DestacarResultadoPage),
      },
      {
        path: 'reports/:publicId/destacar/pendiente',
        data: { estado: 'pendiente' },
        loadComponent: () =>
          import(
            './features/report/presentation/destacar-resultado/destacar-resultado'
          ).then((m) => m.DestacarResultadoPage),
      },
      {
        path: 'reports/:publicId/destacar/error',
        data: { estado: 'error' },
        loadComponent: () =>
          import(
            './features/report/presentation/destacar-resultado/destacar-resultado'
          ).then((m) => m.DestacarResultadoPage),
      },
      {
        path: 'reports/:publicId/edit/datos',
        canActivate: [verifiedGuard],
        loadComponent: () =>
          import(
            './features/report/presentation/report-edit-data/report-edit-data'
          ).then((m) => m.ReportEditDataPage),
      },
      {
        path: 'reports/:publicId/edit/ubicacion',
        canActivate: [verifiedGuard],
        loadComponent: () =>
          import(
            './features/report/presentation/report-edit-location/report-edit-location'
          ).then((m) => m.ReportEditLocationPage),
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
