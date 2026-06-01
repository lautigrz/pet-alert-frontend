import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';

import { EditProfilePage } from './edit-profile-page';
import { ProfileService } from '../../application/profile.service';

import {
  InvalidProfileDataError,
  UserNotFoundError,
} from '../../domain/profile.errors';

describe('EditProfilePage', () => {
  let profileService: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
    uploadProfilePhoto: ReturnType<typeof vi.fn>;
  };

  let component: EditProfilePage;

  beforeEach(() => {
    profileService = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      uploadProfilePhoto: vi.fn(),
    };

    profileService.getProfile.mockResolvedValue({
      id: 'user-123',
      email: 'facundo@example.com',
      username: 'facundo',
      name: 'Facundo',
      lastname: 'Pereira',
      photoUrl: null,
    });

    TestBed.configureTestingModule({
      imports: [EditProfilePage],
      providers: [
        provideRouter([]),
        {
          provide: ProfileService,
          useValue: profileService,
        },
      ],
    });

    const fixture = TestBed.createComponent(EditProfilePage);
    component = fixture.componentInstance;
  });

  describe('profile loading', () => {
    it('loads profile information into the form', async () => {
      // When
      await component.ngOnInit();

      // Then
      expect(profileService.getProfile).toHaveBeenCalled();

      expect(component.form.getRawValue()).toEqual({
        name: 'Facundo',
        lastname: 'Pereira',
        username: 'facundo',
      });

      expect(component.currentPhotoUrl()).toBeNull();
    });

    it('loads profile photo when the profile has photoUrl', async () => {
      // Given
      profileService.getProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: 'https://res.cloudinary.com/demo/profile.jpg',
      });

      // When
      await component.ngOnInit();

      // Then
      expect(component.currentPhotoUrl()).toBe(
        'https://res.cloudinary.com/demo/profile.jpg',
      );
      expect(component.profilePhotoUrl()).toBe(
        'https://res.cloudinary.com/demo/profile.jpg',
      );
    });

    it('shows an error when profile loading fails', async () => {
      // Given
      profileService.getProfile.mockRejectedValue(
        new UserNotFoundError(),
      );

      // When
      await component.ngOnInit();

      // Then
      expect(component.serverError()).toBe(
        'Usuario no encontrado',
      );
    });
  });

  describe('when the form is invalid', () => {
    it('does NOT call ProfileService.updateProfile', async () => {
      // Given
      component.form.patchValue({
        username: '',
      });

      // When
      await component.submit();

      // Then
      expect(profileService.updateProfile).not.toHaveBeenCalled();
      expect(component.form.touched).toBe(true);
    });
  });

  describe('when the form is valid', () => {
    beforeEach(async () => {
      await component.ngOnInit();

      component.form.setValue({
        name: 'Facundo',
        lastname: 'Pereira',
        username: 'facundo',
      });
    });

    it('calls ProfileService.updateProfile', async () => {
      // Given
      profileService.updateProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: null,
      });

      // When
      await component.submit();

      // Then
      expect(profileService.updateProfile).toHaveBeenCalledWith({
        name: 'Facundo',
        lastname: 'Pereira',
        username: 'facundo',
      });
    });

    it('shows success message when update succeeds', async () => {
      // Given
      profileService.updateProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: null,
      });

      // When
      await component.submit();

      // Then
      expect(component.successMessage()).toBe(
        'Perfil actualizado correctamente',
      );

      expect(component.serverError()).toBeNull();
      expect(component.submitting()).toBe(false);
    });

    it('keeps the current photo after profile update response', async () => {
      // Given
      profileService.updateProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: 'https://res.cloudinary.com/demo/profile.jpg',
      });

      // When
      await component.submit();

      // Then
      expect(component.currentPhotoUrl()).toBe(
        'https://res.cloudinary.com/demo/profile.jpg',
      );
    });

    it('shows server error when update fails', async () => {
      // Given
      profileService.updateProfile.mockRejectedValue(
        new InvalidProfileDataError('Username inválido'),
      );

      // When
      await component.submit();

      // Then
      expect(component.serverError()).toBe(
        'Username inválido',
      );

      expect(component.submitting()).toBe(false);
    });
  });

  describe('profile photo upload', () => {
    it('uploads the selected photo and updates currentPhotoUrl', async () => {
      // Given
      const file = new File(['fake-image'], 'perfil.png', {
        type: 'image/png',
      });

      const event = {
        target: {
          files: [file],
          value: 'C:\\fakepath\\perfil.png',
        },
      } as unknown as Event;

      profileService.uploadProfilePhoto.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: 'https://res.cloudinary.com/demo/profile.png',
      });

      // When
      await component.onPhotoSelected(event);

      // Then
      expect(profileService.uploadProfilePhoto).toHaveBeenCalledWith(file);
      expect(component.currentPhotoUrl()).toBe(
        'https://res.cloudinary.com/demo/profile.png',
      );
      expect(component.successMessage()).toBe(
        'Foto de perfil actualizada correctamente',
      );
      expect(component.uploadingPhoto()).toBe(false);
    });

    it('does nothing when no file is selected', async () => {
      // Given
      const event = {
        target: {
          files: [],
          value: '',
        },
      } as unknown as Event;

      // When
      await component.onPhotoSelected(event);

      // Then
      expect(profileService.uploadProfilePhoto).not.toHaveBeenCalled();
    });

    it('rejects unsupported image types', async () => {
      // Given
      const file = new File(['fake-file'], 'perfil.txt', {
        type: 'text/plain',
      });

      const event = {
        target: {
          files: [file],
          value: 'C:\\fakepath\\perfil.txt',
        },
      } as unknown as Event;

      // When
      await component.onPhotoSelected(event);

      // Then
      expect(profileService.uploadProfilePhoto).not.toHaveBeenCalled();
      expect(component.serverError()).toBe(
        'Solo se permiten imágenes JPG, PNG o WEBP',
      );
    });

    it('rejects images bigger than 5MB', async () => {
      // Given
      const file = new File(
        [new ArrayBuffer(5 * 1024 * 1024 + 1)],
        'perfil.png',
        {
          type: 'image/png',
        },
      );

      const event = {
        target: {
          files: [file],
          value: 'C:\\fakepath\\perfil.png',
        },
      } as unknown as Event;

      // When
      await component.onPhotoSelected(event);

      // Then
      expect(profileService.uploadProfilePhoto).not.toHaveBeenCalled();
      expect(component.serverError()).toBe(
        'La imagen no puede superar los 5MB',
      );
    });

    it('shows server error when upload fails', async () => {
      // Given
      const file = new File(['fake-image'], 'perfil.png', {
        type: 'image/png',
      });

      const event = {
        target: {
          files: [file],
          value: 'C:\\fakepath\\perfil.png',
        },
      } as unknown as Event;

      profileService.uploadProfilePhoto.mockRejectedValue(
        new Error('No se pudo subir la imagen'),
      );

      // When
      await component.onPhotoSelected(event);

      // Then
      expect(component.serverError()).toBe(
        'No se pudo subir la imagen',
      );
      expect(component.uploadingPhoto()).toBe(false);
    });
  });

  describe('client-side validation', () => {
    it('requires username', () => {
      // Given
      component.form.patchValue({
        username: '',
      });

      // Then
      expect(
        component.form.get('username')?.hasError('required'),
      ).toBe(true);

      expect(component.form.invalid).toBe(true);
    });

    it('requires username length >= 3', () => {
      // Given
      component.form.patchValue({
        username: 'fa',
      });

      // Then
      expect(
        component.form.get('username')?.hasError('minlength'),
      ).toBe(true);

      expect(component.form.invalid).toBe(true);
    });

    it('rejects names longer than 50 characters', () => {
      // Given
      component.form.patchValue({
        name: 'a'.repeat(51),
      });

      // Then
      expect(
        component.form.get('name')?.hasError('maxlength'),
      ).toBe(true);
    });

    it('rejects lastnames longer than 50 characters', () => {
      // Given
      component.form.patchValue({
        lastname: 'a'.repeat(51),
      });

      // Then
      expect(
        component.form.get('lastname')?.hasError('maxlength'),
      ).toBe(true);
    });
  });
});
