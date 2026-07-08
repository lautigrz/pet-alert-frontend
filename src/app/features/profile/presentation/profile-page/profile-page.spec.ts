import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';

import { ProfilePage } from './profile-page';
import { ProfileService } from '../../application/profile.service';
import { UserNotFoundError } from '../../domain/profile.errors';
import { ReportListService } from '../../../report/application/report-list.service';
import { Reporte } from '../../../report/domain/report-read.model';
import type { UserExperienceSummary } from '../../domain/profile.model';

const mockReporte = (overrides: Partial<Reporte> = {}): Reporte =>
  ({
    publicId: 'rep-1',
    user: { publicId: 'user-123' },
    type: 'LOST',
    status: 'ACTIVE',
    description: 'Descripción',
    location: { address: 'Calle 1', latitude: -34.6, longitude: -58.38 },
    details: { animalType: 'DOG', images: [] },
    occurredAt: '2026-06-01T10:00:00.000Z',
    createdAt: '2026-06-01T10:00:00.000Z',
    ...overrides,
  }) as unknown as Reporte;

describe('ProfilePage', () => {
  let profileService: {
    getProfile: ReturnType<typeof vi.fn>;
    getUserExperience: ReturnType<typeof vi.fn>;
  };

  let reportListService: {
    getMyReports: ReturnType<typeof vi.fn>;
  };

  let component: ProfilePage;

  beforeEach(() => {
    profileService = {
      getProfile: vi.fn(),
      getUserExperience: vi.fn(),
    };

    reportListService = {
      getMyReports: vi.fn(),
    };

    profileService.getProfile.mockResolvedValue({
      id: 'user-123',
      email: 'facundo@example.com',
      username: 'facundo',
      name: 'Facundo',
      lastname: 'Pereira',
      photoUrl: null,
    });

    profileService.getUserExperience.mockResolvedValue({
      xp: 120,
      level: 2,
      unlockedAchievements: [
        {
          code: 'FIRST_STEPS',
          name: 'Primeros pasos',
          description: 'Alcanza 10 XP para empezar',
          requiredXp: 10,
        },
      ],
    } as UserExperienceSummary);

    reportListService.getMyReports.mockResolvedValue([]);

    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        {
          provide: ProfileService,
          useValue: profileService,
        },
        {
          provide: ReportListService,
          useValue: reportListService,
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

  describe('experience widget', () => {
    it('loads the user experience summary and exposes the current level and achievements', async () => {
      await component.ngOnInit();

      expect(profileService.getUserExperience).toHaveBeenCalled();
      expect(component.experience()?.level).toBe(2);
      expect(component.experience()?.unlockedAchievements).toHaveLength(1);
    });

    it('shows a level-up toast when the level increases', async () => {
      profileService.getUserExperience.mockResolvedValueOnce({
        xp: 40,
        level: 1,
        unlockedAchievements: [],
      } as UserExperienceSummary);
      profileService.getUserExperience.mockResolvedValueOnce({
        xp: 140,
        level: 2,
        unlockedAchievements: [],
      } as UserExperienceSummary);

      await component.loadExperience();
      await component.loadExperience();

      expect(component.levelUpPulse()).toBe(true);
    });

    it('lists every achievement under locked when the user has none unlocked', async () => {
      profileService.getUserExperience.mockResolvedValue({
        xp: 0,
        level: 1,
        achievements: [
          { code: 'FIRST_RESCUE', name: 'Primer rescate', description: '', requiredXp: 10, unlocked: false },
          { code: 'SOLIDARY_NEIGHBOR', name: 'Vecino solidario', description: '', requiredXp: 50, unlocked: false },
          { code: 'URBAN_EXPLORER', name: 'Explorador urbano', description: '', requiredXp: 100, unlocked: false },
        ],
        unlockedAchievements: [],
      } as UserExperienceSummary);

      await component.ngOnInit();

      expect(component.unlockedAchievementsList()).toHaveLength(0);
      expect(component.lockedAchievementsList().map((a) => a.code)).toEqual([
        'FIRST_RESCUE',
        'SOLIDARY_NEIGHBOR',
        'URBAN_EXPLORER',
      ]);
    });

    it('moves an achievement to unlocked once its required xp is reached', async () => {
      profileService.getUserExperience.mockResolvedValue({
        xp: 60,
        level: 1,
        achievements: [
          { code: 'FIRST_RESCUE', name: 'Primer rescate', description: '', requiredXp: 10, unlocked: true },
          { code: 'SOLIDARY_NEIGHBOR', name: 'Vecino solidario', description: '', requiredXp: 50, unlocked: true },
          { code: 'URBAN_EXPLORER', name: 'Explorador urbano', description: '', requiredXp: 100, unlocked: false },
        ],
        unlockedAchievements: [],
      } as UserExperienceSummary);

      await component.ngOnInit();

      expect(component.unlockedAchievementsList().map((a) => a.code)).toEqual([
        'FIRST_RESCUE',
        'SOLIDARY_NEIGHBOR',
      ]);
      expect(component.lockedAchievementsList().map((a) => a.code)).toEqual(['URBAN_EXPLORER']);
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

  describe('my reports', () => {
    it('loads all the user reports including resolved and closed ones', async () => {
      // Given
      const reportes = [
        mockReporte({ publicId: 'r-activo', status: 'ACTIVE' }),
        mockReporte({ publicId: 'r-resuelto', status: 'RESOLVED' }),
        mockReporte({ publicId: 'r-cerrado', status: 'CLOSED' }),
      ];
      reportListService.getMyReports.mockResolvedValue(reportes);

      // When
      await component.ngOnInit();

      // Then
      expect(reportListService.getMyReports).toHaveBeenCalled();
      expect(component.reports()).toEqual(reportes);
      expect(component.reportsLoading()).toBe(false);
      expect(component.reportsError()).toBeNull();
    });

    it('shows an error when reports loading fails', async () => {
      // Given
      reportListService.getMyReports.mockRejectedValue(
        new Error('No se pudieron cargar los reportes'),
      );

      // When
      await component.ngOnInit();

      // Then
      expect(component.reportsError()).toBe('No se pudieron cargar los reportes');
      expect(component.reportsLoading()).toBe(false);
      expect(component.reports()).toEqual([]);
    });
  });
});
