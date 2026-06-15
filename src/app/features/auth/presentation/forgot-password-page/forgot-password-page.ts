import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { NetworkError, RateLimitedError } from '../../domain/auth.errors';
import { ToastService } from '../../../../shared/application/toast.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.css',
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly submitting = signal(false);
  readonly enviado = signal(false);
  readonly emailEnviado = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
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
    try {
      const { email } = this.form.getRawValue();
      await this.authService.requestPasswordReset(email);
      this.emailEnviado.set(email.trim().toLowerCase());
      this.enviado.set(true);
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
