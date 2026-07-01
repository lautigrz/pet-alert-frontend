import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ProfileService } from './profile.service';
import { ProfileHttp } from '../infrastructure/profile.http';

import {
  InvalidProfileDataError,
  NetworkError,
  UnexpectedProfileError,
  UserNotFoundError,
} from '../domain/profile.errors';

describe('ProfileService.updateProfile', () => {
  let profileHttp: {
    updateProfile: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
  };

  let service: ProfileService;

  beforeEach(() => {
    profileHttp = {
      updateProfile: vi.fn(),
      getProfile: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        {
          provide: ProfileHttp,
          useValue: profileHttp,
        },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  describe('when the profile is updated successfully', () => {
    it('returns the updated profile and trims values before sending', async () => {
      // Given
      profileHttp.updateProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: 'https://image.com/avatar.jpg',
      });

      // When
      const result = await service.updateProfile({
        name: ' Facundo ',
        lastname: ' Pereira ',
        username: ' facundo ',
        photoUrl: ' https://image.com/avatar.jpg ',
      });

      // Then
      expect(profileHttp.updateProfile).toHaveBeenCalledWith({
        name: 'Facundo',
        lastname: 'Pereira',
        username: 'facundo',
        photoUrl: 'https://image.com/avatar.jpg',
      });

      expect(result).toEqual({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: 'https://image.com/avatar.jpg',
        role: null,
      });
    });
  });

  describe('when the backend returns 400', () => {
    it('throws InvalidProfileDataError', async () => {
      // Given
      profileHttp.updateProfile.mockRejectedValue(
        new HttpErrorResponse({
          status: 400,
          error: {
            error: 'Invalid username',
          },
        }),
      );

      // When
      const action = () =>
        service.updateProfile({
          username: 'fa',
        });

      // Then
      await expect(action).rejects.toThrow(InvalidProfileDataError);
    });
  });

  describe('when the backend returns 404', () => {
    it('throws UserNotFoundError', async () => {
      // Given
      profileHttp.updateProfile.mockRejectedValue(
        new HttpErrorResponse({
          status: 404,
        }),
      );

      // When
      const action = () =>
        service.updateProfile({
          username: 'facundo',
        });

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {
      // Given
      profileHttp.updateProfile.mockRejectedValue(
        new HttpErrorResponse({
          status: 0,
        }),
      );

      // When
      const action = () =>
        service.updateProfile({
          username: 'facundo',
        });

      // Then
      await expect(action).rejects.toThrow(NetworkError);
    });
  });

  describe('when an unexpected error occurs', () => {
    it('throws UnexpectedProfileError', async () => {
      // Given
      profileHttp.updateProfile.mockRejectedValue(
        new Error('boom'),
      );

      // When
      const action = () =>
        service.updateProfile({
          username: 'facundo',
        });

      // Then
      await expect(action).rejects.toThrow(UnexpectedProfileError);
    });
  });
});

describe('ProfileService.getProfile', () => {
  let profileHttp: {
    updateProfile: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
  };

  let service: ProfileService;

  beforeEach(() => {
    profileHttp = {
      updateProfile: vi.fn(),
      getProfile: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        {
          provide: ProfileHttp,
          useValue: profileHttp,
        },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  describe('when the profile exists', () => {
    it('returns the profile information', async () => {
      // Given
      profileHttp.getProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: null,
        role: 'USER',
      });

      // When
      const profile = await service.getProfile();

      // Then
      expect(profile).toEqual({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: null,
        role: 'USER',
      });
    });
  });

  describe('when the backend returns 404', () => {
    it('throws UserNotFoundError', async () => {
      // Given
      profileHttp.getProfile.mockRejectedValue(
        new HttpErrorResponse({
          status: 404,
        }),
      );

      // When
      const action = () => service.getProfile();

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });
});

describe('ProfileService.getPublicProfile', () => {
  let profileHttp: {
    getPublicProfile: ReturnType<typeof vi.fn>;
  };

  let service: ProfileService;

  beforeEach(() => {
    profileHttp = {
      getPublicProfile: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        {
          provide: ProfileHttp,
          useValue: profileHttp,
        },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  describe('when the public profile exists', () => {
    it('returns only public fields (no email) normalizing optionals to null', async () => {
      // Given
      profileHttp.getPublicProfile.mockResolvedValue({
        id: 'user-999',
        username: 'ana',
        name: 'Ana',
      });

      // When
      const profile = await service.getPublicProfile('user-999');

      // Then
      expect(profileHttp.getPublicProfile).toHaveBeenCalledWith('user-999');
      expect(profile).toEqual({
        id: 'user-999',
        username: 'ana',
        name: 'Ana',
        lastname: null,
        photoUrl: null,
      });
    });
  });

  describe('when the backend returns 404', () => {
    it('throws UserNotFoundError', async () => {
      // Given
      profileHttp.getPublicProfile.mockRejectedValue(
        new HttpErrorResponse({ status: 404 }),
      );

      // When
      const action = () => service.getPublicProfile('inexistente');

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });
});
