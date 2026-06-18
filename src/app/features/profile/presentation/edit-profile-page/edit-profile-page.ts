import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../application/profile.service';
import { NotificationToggle } from '../../../notifications/presentation/notification-toggle/notification-toggle';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, NotificationToggle],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './edit-profile-page.html',
  styleUrl: './edit-profile-page.css',
})
export class EditProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);
  readonly currentPhotoUrl = signal<string | null>(null);
  readonly defaultPhotoUrl ='https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';
  readonly uploadingPhoto = signal(false);


  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.maxLength(50)]],
    lastname: ['', [Validators.maxLength(50)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
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
  return this.currentPhotoUrl() || this.defaultPhotoUrl;
  }

  async onPhotoSelected(event:Event): Promise<void>{
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if(!file)return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSizeInBytes = 5 * 1024 * 1024;

    if(!allowedTypes.includes(file.type)){
      this.serverError.set('Solo se permiten imágenes JPG, PNG o WEBP');
      input.value = '';
      return;
    }

    if (file.size > maxSizeInBytes) {
      this.serverError.set('La imagen no puede superar los 5MB');
      input.value = '';
      return;
    }

    this.uploadingPhoto.set(true);
    this.successMessage.set(null);
    this.serverError.set(null);

    try{
      const updated = await this.profileService.uploadProfilePhoto(file);

      this.currentPhotoUrl.set(updated.photoUrl ?? null);
      this.successMessage.set('Foto de perfil actualizada correctamente');
    } catch(error){
      this.serverError.set(
        error instanceof Error
          ? error.message
          : 'No se pudo subir la foto de perfil',
      );
    } finally {
      this.uploadingPhoto.set(false);
      input.value = '';
    }

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
      const { name, lastname, username, } =
        this.form.getRawValue();

      const updated = await this.profileService.updateProfile({
        name,
        lastname,
        username,
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
