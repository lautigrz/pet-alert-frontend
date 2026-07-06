import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorage } from '../../auth/infrastructure/token.storage';
import { ProfileService } from '../../profile/application/profile.service';
import { ADMIN_ROLE } from '../domain/admin-role';

export const adminGuard: CanActivateFn = async () => {
  const tokenStorage = inject(TokenStorage);
  const profileService = inject(ProfileService);
  const router = inject(Router);
  if (!tokenStorage.read()?.accessToken) {
    return redirectToAdminLogin(router);
  }
  return (await isAdmin(profileService)) ? true : redirectToAdminLogin(router);
};

export const adminGuestGuard: CanActivateFn = async () => {
  const tokenStorage = inject(TokenStorage);
  const profileService = inject(ProfileService);
  const router = inject(Router);
  if (!tokenStorage.read()?.accessToken) {
    return true;
  }
  router.navigateByUrl((await isAdmin(profileService)) ? '/admin' : '/home');
  return false;
};

async function isAdmin(profileService: ProfileService): Promise<boolean> {
  try {
    const profile = await profileService.getProfile();
    return profile.role === ADMIN_ROLE;
  } catch {
    return false;
  }
}

function redirectToAdminLogin(router: Router): boolean {
  router.navigateByUrl('/admin/login');
  return false;
}
