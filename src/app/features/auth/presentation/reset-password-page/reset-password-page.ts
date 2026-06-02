import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { NetworkError, RateLimitedError } from '../../domain/auth.errors';
import { ToastService } from '../../../../shared/application/toast.service';
import { passwordsMatch } from '../register-page/password-match.validator';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.css',
})
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly submitting = signal(false);
  readonly exito = signal(false);
  readonly tokenAusente = signal(this.token.length === 0);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch('password', 'confirmPassword') },
  );

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  get passwordsMismatch(): boolean {
    return (
      this.form.hasError('passwordsMismatch') &&
      !!this.form.get('confirmPassword')?.touched
    );
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    try {
      const { password } = this.form.getRawValue();
      await this.authService.resetPassword(this.token, password);
      this.exito.set(true);
    } catch (error) {
      if (error instanceof NetworkError || error instanceof RateLimitedError) {
        this.toastService.error(error.message);
      } else {
        this.toastService.error(
          error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        );
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
