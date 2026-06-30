import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/application/auth.service';
import { NetworkError, UnexpectedAuthError } from '../../../auth/domain/auth.errors';
import { ToastService } from '../../../../shared/application/toast.service';
import { ProfileService } from '../../../profile/application/profile.service';
import { ADMIN_ROLE } from '../../domain/admin-role';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-login.html',
})
export class AdminLoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    try {
      await this.authenticateAdmin();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  private async authenticateAdmin(): Promise<void> {
    const { email, password } = this.form.getRawValue();
    await this.authService.login({ email, password });
    this.profileService.clearCache();
    const profile = await this.profileService.getProfile();
    if (profile.role !== ADMIN_ROLE) {
      return this.rejectNonAdmin();
    }
    await this.router.navigateByUrl('/admin');
  }

  private async rejectNonAdmin(): Promise<void> {
    await this.authService.logout();
    this.serverError.set('No tenés permisos de administrador.');
  }

  private handleError(error: unknown): void {
    if (error instanceof NetworkError || error instanceof UnexpectedAuthError) {
      this.toastService.error(error.message);
    } else {
      this.serverError.set(error instanceof Error ? error.message : 'Error desconocido');
    }
  }
}
