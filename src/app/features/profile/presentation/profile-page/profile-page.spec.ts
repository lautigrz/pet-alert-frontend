import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';

import { ProfilePage } from './profile-page';
import { ProfileService } from '../../application/profile.service';
import { UserNotFoundError } from '../../domain/profile.errors';

describe('ProfilePage', () => {
  let profileService: {
    getProfile: ReturnType<typeof vi.fn>;
  };

  let component: ProfilePage;

  beforeEach(() => {
    profileService = {
      getProfile: vi.fn(),
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
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        {
          provide: ProfileService,
          useValue: profileService,
        },
      ],
    });

    const fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
  });

  describe('profile loading', () => {
    it('loads the current user profile', async () => {
      // When
      await component.ngOnInit();

      // Then
      expect(profileService.getProfile).toHaveBeenCalled();

      expect(component.profile()).toEqual({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: null,
      });

      expect(component.loading()).toBe(false);
      expect(component.serverError()).toBeNull();
    });

    it('shows an error when profile loading fails', async () => {
      // Given
      profileService.getProfile.mockRejectedValue(
        new UserNotFoundError(),
      );

      // When
      await component.ngOnInit();

      // Then
      expect(component.serverError()).toBe('Usuario no encontrado');
      expect(component.loading()).toBe(false);
      expect(component.profile()).toBeNull();
    });
  });

  describe('profile photo', () => {
    it('returns default photo when user has no photoUrl', async () => {
      // When
      await component.ngOnInit();

      // Then
      expect(component.profilePhotoUrl()).toBe(component.defaultPhotoUrl);
    });

    it('returns user photoUrl when profile has photoUrl', async () => {
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
      expect(component.profilePhotoUrl()).toBe(
        'https://res.cloudinary.com/demo/profile.jpg',
      );
    });
  });

  describe('displayName', () => {
    it('returns full name when name and lastname exist', async () => {
      // When
      await component.ngOnInit();

      // Then
      expect(component.displayName()).toBe('Facundo Pereira');
    });

    it('returns username when name and lastname are missing', async () => {
      // Given
      profileService.getProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: null,
        lastname: null,
        photoUrl: null,
      });

      // When
      await component.ngOnInit();

      // Then
      expect(component.displayName()).toBe('facundo');
    });

    it('returns empty string when profile is not loaded yet', () => {
      // Then
      expect(component.displayName()).toBe('');
    });
  });

  describe('tabs', () => {
    it('starts with reports tab selected', () => {
      // Then
      expect(component.activeTab()).toBe('reports');
    });

    it('changes active tab to missions', () => {
      // When
      component.setTab('missions');

      // Then
      expect(component.activeTab()).toBe('missions');
    });

    it('changes active tab to achievements', () => {
      // When
      component.setTab('achievements');

      // Then
      expect(component.activeTab()).toBe('achievements');
    });
  });

  describe('profile edit route', () => {
    it('has edit profile route configured', () => {
      // Then
      expect(component.rutaMiPerfil).toBe('/profile/edit');
    });
  });
});
