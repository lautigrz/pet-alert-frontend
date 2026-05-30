import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { NetworkError, UnexpectedAuthError } from '../../domain/auth.errors';
import { ToastService } from '../../../../shared/application/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  readonly mobileView = signal<'landing' | 'form'>('landing');
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(255)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    ],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('verification') === 'sent') {
      this.toastService.success('Te enviamos un correo para verificar tu cuenta');
    }
  }

  goToForm(): void {
    const docWithTransition = document as Document & {
      startViewTransition?: (cb: () => Promise<void> | void) => unknown;
    };
    if (!docWithTransition.startViewTransition) {
      this.mobileView.set('form');
      return;
    }
    docWithTransition.startViewTransition(async () => {
      this.mobileView.set('form');
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
  }

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
      const { email, password } = this.form.getRawValue();
      await this.authService.login({ email, password });
      await this.router.navigateByUrl('/');
    } catch (error) {
      if (error instanceof NetworkError || error instanceof UnexpectedAuthError) {
        this.toastService.error(error.message);
      } else {
        this.serverError.set(error instanceof Error ? error.message : 'Error desconocido');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
