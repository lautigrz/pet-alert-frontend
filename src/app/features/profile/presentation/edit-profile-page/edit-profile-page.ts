import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../application/profile.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './edit-profile-page.html',
  styleUrl: './edit-profile-page.css',
})
export class EditProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);
  readonly currentPhotoUrl = signal<string | null>(null);
  readonly defaultPhotoUrl ='https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';


  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.maxLength(50)]],
    lastname: ['', [Validators.maxLength(50)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    photoUrl: ['', [Validators.maxLength(500)]],
  });

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    try{
      const profile = await this.profileService.getProfile();

      this.form.patchValue(
        {
          name: profile.name ?? '',
        lastname: profile.lastname ?? '',
        username: profile.username ?? '',
        photoUrl: profile.photoUrl ?? '',
        }
      );
      this.currentPhotoUrl.set(profile.photoUrl ?? null);
    } catch(error){
       this.serverError.set(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el perfil',
      );
    }
  }
  hasError(controlName: string, errorName: string): boolean {
    const control= this.form.get(controlName);

    return !!control && control.touched && control.hasError(errorName);
  }

  profilePhotoUrl(): string {
  return (
    this.form.controls.photoUrl.value ||
    this.currentPhotoUrl() ||
    this.defaultPhotoUrl
  );
}

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.serverError.set(null);

    try {
      const { name, lastname, username, photoUrl } =
        this.form.getRawValue();

      const updated = await this.profileService.updateProfile({
        name,
        lastname,
        username,
        photoUrl,
      });

      this.currentPhotoUrl.set(updated.photoUrl ?? null);

      this.successMessage.set('Perfil actualizado correctamente');
    } catch (error) {
      this.serverError.set(
        error instanceof Error
          ? error.message
          : 'Ocurrio un error inesperado',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
