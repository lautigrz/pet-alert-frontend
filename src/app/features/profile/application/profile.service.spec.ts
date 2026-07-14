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

const fakeStats = {
  reportsCreated: 2,
  successfulReturns: 1,
  activeDays: 15,
  petsHelped: 0,
};

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
        stats: null,
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
      profileHttp.updateProfile.mockRejectedValue(new Error('boom'));

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
        stats: fakeStats,
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
        stats: fakeStats,
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
        stats: null,
      });
    });
  });

  describe('when the backend returns 404', () => {
    it('throws UserNotFoundError', async () => {
      // Given
      profileHttp.getPublicProfile.mockRejectedValue(new HttpErrorResponse({ status: 404 }));

      // When
      const action = () => service.getPublicProfile('inexistente');

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });
});
describe('ProfileService.createUserReview', () => {
  let profileHttp: {
    createUserReview: ReturnType<typeof vi.fn>;
  };

  let service: ProfileService;

  beforeEach(() => {
    profileHttp = {
      createUserReview: vi.fn(),
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

  describe('when the review is created successfully', () => {
    it('trims the description before sending it', async () => {
      // Given
      const review = {
        id: 1,
        rating: 5,
        description: 'Excelente',
        createdAt: '2026-07-01T10:00:00Z',
        updatedAt: '2026-07-01T10:00:00Z',
        reviewer: {
          id: 'reviewer-1',
          username: 'facundo',
          name: 'Facundo',
          lastname: 'Pereira',
          photoUrl: null,
        },
      };

      profileHttp.createUserReview.mockResolvedValue(review);

      // When
      const result = await service.createUserReview({
        reviewedUserId: 'user-123',
        rating: 5,
        description: '   Excelente   ',
      });

      // Then
      expect(profileHttp.createUserReview).toHaveBeenCalledWith('user-123', {
        rating: 5,
        description: 'Excelente',
      });

      expect(result).toEqual(review);
    });

    it('sends null when the description is empty', async () => {
      // Given
      profileHttp.createUserReview.mockResolvedValue({});

      // When
      await service.createUserReview({
        reviewedUserId: 'user-123',
        rating: 4,
        description: '     ',
      });

      // Then
      expect(profileHttp.createUserReview).toHaveBeenCalledWith('user-123', {
        rating: 4,
        description: null,
      });
    });
  });

  describe('when the backend returns 404', () => {
    it('throws UserNotFoundError', async () => {
      // Given
      profileHttp.createUserReview.mockRejectedValue(
        new HttpErrorResponse({
          status: 404,
        }),
      );

      // When
      const action = () =>
        service.createUserReview({
          reviewedUserId: 'missing-user',
          rating: 5,
        });

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });
});

describe('ProfileService.getUserReviews', () => {
  let profileHttp: {
    getUserReviews: ReturnType<typeof vi.fn>;
  };

  let service: ProfileService;

  beforeEach(() => {
    profileHttp = {
      getUserReviews: vi.fn(),
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

  describe('when the reviews are retrieved successfully', () => {
    it('returns the paginated reviews', async () => {
      // Given
      const response = {
        items: [],
        page: 2,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      };

      profileHttp.getUserReviews.mockResolvedValue(response);

      // When
      const result = await service.getUserReviews('user-123', 2, 20);

      // Then
      expect(profileHttp.getUserReviews).toHaveBeenCalledWith('user-123', 2, 20);

      expect(result).toEqual(response);
    });
  });

  describe('when the backend returns 404', () => {
    it('throws UserNotFoundError', async () => {
      // Given
      profileHttp.getUserReviews.mockRejectedValue(
        new HttpErrorResponse({
          status: 404,
        }),
      );

      // When
      const action = () => service.getUserReviews('missing-user');

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });
});

describe('ProfileService.getMyReviews', () => {
  let profileHttp: {
    getMyReviews: ReturnType<typeof vi.fn>;
  };

  let service: ProfileService;

  beforeEach(() => {
    profileHttp = {
      getMyReviews: vi.fn(),
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

  describe('when the reviews are retrieved successfully', () => {
    it('returns the authenticated user reviews', async () => {
      // Given
      const response = {
        received: {
          items: [],
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
        given: {
          items: [],
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      };

      profileHttp.getMyReviews.mockResolvedValue(response);

      // When
      const result = await service.getMyReviews();

      // Then
      expect(profileHttp.getMyReviews).toHaveBeenCalledWith(1, 10);

      expect(result).toEqual(response);
    });
  });

  describe('when there is no network', () => {
    it('throws NetworkError', async () => {
      // Given
      profileHttp.getMyReviews.mockRejectedValue(
        new HttpErrorResponse({
          status: 0,
        }),
      );

      // When
      const action = () => service.getMyReviews();

      // Then
      await expect(action).rejects.toThrow(NetworkError);
    });
  });
});

describe('ProfileService.getUserRating', () => {
  let profileHttp: {
    getUserRating: ReturnType<typeof vi.fn>;
  };

  let service: ProfileService;

  beforeEach(() => {
    profileHttp = {
      getUserRating: vi.fn(),
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

  describe('when the rating summary is retrieved successfully', () => {
    it('returns the user rating summary', async () => {
      // Given
      const summary = {
        averageRating: 4.8,
        totalReviews: 15,
      };

      profileHttp.getUserRating.mockResolvedValue(summary);

      // When
      const result = await service.getUserRating('user-123');

      // Then
      expect(profileHttp.getUserRating).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(summary);
    });
  });

  describe('when the backend returns 404', () => {
    it('throws UserNotFoundError', async () => {
      // Given
      profileHttp.getUserRating.mockRejectedValue(
        new HttpErrorResponse({
          status: 404,
        }),
      );

      // When
      const action = () => service.getUserRating('missing-user');

      // Then
      await expect(action).rejects.toThrow(UserNotFoundError);
    });
  });
});
