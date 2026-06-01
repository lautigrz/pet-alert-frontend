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
    canActivate:[authGuard],
    loadComponent: () =>
      import(
        './features/profile/presentation/edit-profile-page/edit-profile-page'
      ).then((m) => m.EditProfilePage),


  },
];
