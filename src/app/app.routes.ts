import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'detalle-reporte',
    loadComponent: () =>
      import(
        './features/reportes/pages/detalle-reporte/detalle-reporte.component'
      ).then((m) => m.DetalleReporteComponent),


  },

  {
    path: 'profile/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/profile/presentation/edit-profile-page/edit-profile-page'
      ).then((m) => m.EditProfilePage),


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
        path: 'location',
        loadComponent: () =>
          import('./features/report/presentation/crear-reporte-2/report-loc-page/report-loc-page').then(
            (m) => m.ReportLocationPage,
          ),
      },
      {
        path: 'review',
        loadComponent: () =>
          import('./features/report/presentation/crear-reporte-2/report-rev-page/report-rev-page').then(
            (m) => m.ReportRevPage,
          ),
      },
      {
        path: 'confirm',
        loadComponent: () =>
          import('./features/report/presentation/crear-reporte-2/report-confirm-page/report-confirm-page').then(
            (m) => m.ReportConfirmPage,
          ),
      },

      
      {
        path: 'lost-data',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/report/presentation/crear-reporte-1/lost-data-page/lost-data-page').then(
            (m) => m.LostDataPage,
          ),
      },
      {
        path: 'lost-location',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/report/presentation/crear-reporte-1/lost-loc-page/lost-loc-page').then(
            (m) => m.LostLocationPage,
          ),
      },
      {
        path: 'lost-review',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/report/presentation/crear-reporte-1/lost-rev-page/lost-rev-page').then(
            (m) => m.LostRevPage,
          ),
      },
      {
        path: 'lost-confirm',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/report/presentation/crear-reporte-1/lost-confirm-page/lost-confirm-page').then(
            (m) => m.LostConfirmPage,
          ),
      },
    ],
  },
];