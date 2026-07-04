import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppealService } from '../../application/appeal.service';
import { ToastService } from '../../../../shared/application/toast.service';

@Component({
  selector: 'app-appeal-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './appeal-form-page.html',
})
export class AppealFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly appealService = inject(AppealService);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly submitting = signal(false);
  protected readonly exito = signal(false);
  protected readonly tokenAusente = signal(this.token.length === 0);

  protected readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  protected hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    try {
      const { message } = this.form.getRawValue();
      await this.appealService.appeal({ token: this.token, message });
      this.exito.set(true);
    } catch (error) {
      this.toastService.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado');
    } finally {
      this.submitting.set(false);
    }
  }
}
