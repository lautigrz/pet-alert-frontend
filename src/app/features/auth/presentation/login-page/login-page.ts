import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';

const VERIFICATION_TOAST_MS = 5000;

function emailFormatIfHasAt(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value || !value.includes('@')) return null;
  return Validators.email(control);
}

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

  readonly mobileView = signal<'landing' | 'form'>('landing');
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    emailOrUsername: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(255),
        emailFormatIfHasAt,
      ],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    ],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('verification') === 'sent') {
      this.toastMessage.set('Te enviamos un correo para verificar tu cuenta');
      setTimeout(() => this.toastMessage.set(null), VERIFICATION_TOAST_MS);
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
      const { emailOrUsername, password } = this.form.getRawValue();
      await this.authService.login({ emailOrUsername, password });
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      this.submitting.set(false);
    }
  }
}
