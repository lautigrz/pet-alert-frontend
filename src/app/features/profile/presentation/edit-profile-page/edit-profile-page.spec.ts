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
  };

  let component: EditProfilePage;

  beforeEach(() => {
    profileService = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
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
        photoUrl: '',
      });
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
        photoUrl: '',
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
        photoUrl: '',
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

    it('rejects photo urls longer than 500 characters', () => {
      // Given
      component.form.patchValue({
        photoUrl: 'a'.repeat(501),
      });

      // Then
      expect(
        component.form.get('photoUrl')?.hasError('maxlength'),
      ).toBe(true);
    });
  });
});
