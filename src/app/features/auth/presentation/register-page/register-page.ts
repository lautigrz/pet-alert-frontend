import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { passwordsMatch } from './password-match.validator';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[\p{L}\d_\s]+$/u),
        ],
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
      ],
      passwordConfirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch('password', 'passwordConfirm') },
  );

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  passwordsMismatch(): boolean {
    return (
      this.form.touched &&
      this.form.hasError('passwordsMismatch') &&
      !!this.form.get('passwordConfirm')?.value
    );
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    try {
      const { email, username, password } = this.form.getRawValue();
      await this.authService.register({ email, username, password });
      await this.router.navigateByUrl('/verify-email-sent');
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      this.submitting.set(false);
    }
  }
}
