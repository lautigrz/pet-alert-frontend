import { Routes } from '@angular/router';
import { HomeMapComponent } from './features/home-map/home-map';

import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
   {
  path: 'home',
  loadComponent: () =>
    import('./features/home-map/home-map').then(
      (m) => m.HomeMapComponent
    ),
},
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
    path: 'detalle-reporte',
    loadComponent: () =>
      import(
        './features/reportes/pages/detalle-reporte/detalle-reporte.component'
      ).then((m) => m.DetalleReporteComponent),


  },

  {
    path: 'reportes',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/reportes/pages/lista-reportes/lista-reportes.component'
      ).then((m) => m.ListaReportesComponent),
  },

  {
    path: 'profile/edit',
    canActivate:[authGuard],
    loadComponent: () =>
      import(
        './features/profile/presentation/edit-profile-page/edit-profile-page'
      ).then((m) => m.EditProfilePage),


  },
];





