import { Routes } from '@angular/router';

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
];
