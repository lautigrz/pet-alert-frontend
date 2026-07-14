import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProfilePage } from './profile-page';
import { ProfileService } from '../../application/profile.service';
import { UserNotFoundError } from '../../domain/profile.errors';
import { ReportListService } from '../../../report/application/report-list.service';
import { Reporte } from '../../../report/domain/report-read.model';
import type { UserExperienceSummary } from '../../domain/profile.model';
import { MissionService } from '../../../missions/application/mission.service';
import { MissionOutput } from '../../../missions/infrastructure/models/mission.model';
import { ToastService } from '../../../../shared/application/toast.service';
import { NotificationService } from '../../../notifications/application/notification.service';

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

const mockMission = (overrides: Partial<MissionOutput> = {}): MissionOutput =>
  ({
    publicId: 'mission-1',
    title: 'Buscar a Milo',
    description: 'Búsqueda comunitaria',
    status: 'IN_PROGRESS',
    createdAt: new Date('2026-07-08T10:00:00.000Z'),
    updatedAt: null,
    searchArea: {
      latitude: -34.6,
      longitude: -58.4,
      radius: 1000,
    },
    report: {
      publicId: 'report-1',
      description: 'Perro perdido',
      location: {
        address: 'San Justo',
        latitude: -34.6,
        longitude: -58.4,
      },
      photoUrl: null,
      title: 'Milo',
      type: 'LOST',
      status: 'ACTIVE',
    },
    volunteers: [],
    ...overrides,
  }) as MissionOutput;

describe('ProfilePage', () => {
  let profileService: {
    getProfile: ReturnType<typeof vi.fn>;
    getUserExperience: ReturnType<typeof vi.fn>;
    getUserRating: ReturnType<typeof vi.fn>;
    getMyReviews: ReturnType<typeof vi.fn>;
  };

  let reportListService: {
    getMyReports: ReturnType<typeof vi.fn>;
  };

  let missionService: {
    getActiveMissionsWithDetails: ReturnType<typeof vi.fn>;
  };

  let toastService: {
    brand: ReturnType<typeof vi.fn>;
  };

  let notificationService: {
    showLocal: ReturnType<typeof vi.fn>;
  };

  let component: ProfilePage;

  beforeEach(() => {
    localStorage.clear();

    profileService = {
      getProfile: vi.fn(),
      getUserExperience: vi.fn(),
      getUserRating: vi.fn(),
      getMyReviews: vi.fn(),
    };

    reportListService = {
      getMyReports: vi.fn(),
    };

    missionService = {
      getActiveMissionsWithDetails: vi.fn().mockReturnValue(of([])),
    };

    toastService = {
      brand: vi.fn(),
    };

    notificationService = {
      showLocal: vi.fn(),
    };

    profileService.getProfile.mockResolvedValue({
      id: 'user-123',
      email: 'facundo@example.com',
      username: 'facundo',
      name: 'Facundo',
      lastname: 'Pereira',
      photoUrl: null,
      stats: null,
    });

    profileService.getUserRating.mockResolvedValue({
      average: 0,
      count: 0,
    });

    profileService.getMyReviews.mockResolvedValue({
      received: { items: [] },
      given: { items: [] },
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
        {
          provide: MissionService,
          useValue: missionService,
        },
        {
          provide: ToastService,
          useValue: toastService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
      ],
    });

    const fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
  });

  describe('profile loading', () => {
    it('loads the current user profile', async () => {
      await component.ngOnInit();

      expect(profileService.getProfile).toHaveBeenCalled();

      expect(component.profile()).toEqual({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: null,
        stats: null,
      });

      expect(component.loading()).toBe(false);
      expect(component.serverError()).toBeNull();
    });

    it('shows an error when profile loading fails', async () => {
      profileService.getProfile.mockRejectedValue(new UserNotFoundError());

      await component.ngOnInit();

      expect(component.serverError()).toBe('Usuario no encontrado');
      expect(component.loading()).toBe(false);
      expect(component.profile()).toBeNull();
    });
  });

  describe('profile photo', () => {
    it('returns default photo when user has no photoUrl', async () => {
      await component.ngOnInit();

      expect(component.profilePhotoUrl()).toBe(component.defaultPhotoUrl);
    });

    it('returns user photoUrl when profile has photoUrl', async () => {
      profileService.getProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: 'Facundo',
        lastname: 'Pereira',
        photoUrl: 'https://res.cloudinary.com/demo/profile.jpg',
        stats: null,
      });

      await component.ngOnInit();

      expect(component.profilePhotoUrl()).toBe('https://res.cloudinary.com/demo/profile.jpg');
    });
  });

  describe('displayName', () => {
    it('returns full name when name and lastname exist', async () => {
      await component.ngOnInit();

      expect(component.displayName()).toBe('Facundo Pereira');
    });

    it('returns username when name and lastname are missing', async () => {
      profileService.getProfile.mockResolvedValue({
        id: 'user-123',
        email: 'facundo@example.com',
        username: 'facundo',
        name: null,
        lastname: null,
        photoUrl: null,
        stats: null,
      });

      await component.ngOnInit();

      expect(component.displayName()).toBe('facundo');
    });

    it('returns empty string when profile is not loaded yet', () => {
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
      expect(component.currentCelebration()?.title).toBe('¡Subiste de nivel!');
      expect(notificationService.showLocal).toHaveBeenCalledWith(
        '¡Subiste de nivel!',
        'Ahora estás en el nivel 2.',
      );
    });

    it('queues a celebration when a new achievement is unlocked', async () => {
      profileService.getUserExperience.mockResolvedValueOnce({
        xp: 0,
        level: 1,
        unlockedAchievements: [],
      } as UserExperienceSummary);

      profileService.getUserExperience.mockResolvedValueOnce({
        xp: 10,
        level: 1,
        unlockedAchievements: [
          {
            code: 'FIRST_RESCUE',
            name: 'Primer rescate',
            description: '',
            requiredXp: 10,
            icon: '🐾',
            unlocked: true,
          },
        ],
      } as UserExperienceSummary);

      await component.loadExperience();
      await component.loadExperience();

      expect(component.currentCelebration()?.title).toBe('¡Logro desbloqueado!');
      expect(component.currentCelebration()?.subtitle).toBe('Primer rescate');
    });

    it('lists every achievement under locked when the user has none unlocked', async () => {
      profileService.getUserExperience.mockResolvedValue({
        xp: 0,
        level: 1,
        achievements: [
          {
            code: 'FIRST_RESCUE',
            name: 'Primer rescate',
            description: '',
            requiredXp: 10,
            unlocked: false,
          },
          {
            code: 'SOLIDARY_NEIGHBOR',
            name: 'Vecino solidario',
            description: '',
            requiredXp: 50,
            unlocked: false,
          },
          {
            code: 'URBAN_EXPLORER',
            name: 'Explorador urbano',
            description: '',
            requiredXp: 100,
            unlocked: false,
          },
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
          {
            code: 'FIRST_RESCUE',
            name: 'Primer rescate',
            description: '',
            requiredXp: 10,
            unlocked: true,
          },
          {
            code: 'SOLIDARY_NEIGHBOR',
            name: 'Vecino solidario',
            description: '',
            requiredXp: 50,
            unlocked: true,
          },
          {
            code: 'URBAN_EXPLORER',
            name: 'Explorador urbano',
            description: '',
            requiredXp: 100,
            unlocked: false,
          },
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

  describe('missions', () => {
    it('splits missions into own (created) and joined', async () => {
      const ownMission = mockMission({
        publicId: 'mission-own',
        report: { ...mockMission().report, publicId: 'report-1' },
        volunteers: [],
      });
      const joinedMission = mockMission({
        publicId: 'mission-joined',
        report: { ...mockMission().report, publicId: 'report-2' },
        volunteers: [
          { publicId: 'user-123', username: 'fran', photoUrl: null, name: null, lastname: null },
        ],
      });

      reportListService.getMyReports.mockResolvedValue([{ publicId: 'report-1' }]);
      missionService.getActiveMissionsWithDetails.mockReturnValue(of([ownMission, joinedMission]));

      await component.ngOnInit();

      expect(component.ownMissions()).toEqual([ownMission]);
      expect(component.joinedMissions()).toEqual([joinedMission]);
      expect(component.missionsLoading()).toBe(false);
      expect(component.missionsError()).toBeNull();
    });

    it('shows an error when missions loading fails', async () => {
      missionService.getActiveMissionsWithDetails.mockReturnValue(
        throwError(() => new Error('No se pudieron cargar tus misiones')),
      );

      await component.ngOnInit();

      expect(component.missionsError()).toBe('No se pudieron cargar tus misiones');
      expect(component.missionsLoading()).toBe(false);
      expect(component.ownMissions()).toEqual([]);
      expect(component.joinedMissions()).toEqual([]);
    });

    it('translates mission statuses', () => {
      expect(component.missionStatusLabel('OPEN')).toBe('Abierta');
      expect(component.missionStatusLabel('IN_PROGRESS')).toBe('En progreso');
      expect(component.missionStatusLabel('CLOSED')).toBe('Cerrada');
    });

    it('formats mission date', () => {
      expect(component.missionDate(new Date('2026-07-08T10:00:00.000Z'))).toBe('08/07/2026');
    });

    it('returns the original mission status when it is unknown', () => {
      expect(component.missionStatusLabel('PAUSED')).toBe('PAUSED');
    });

    it('returns "Sin fecha" for an invalid mission date', () => {
      expect(component.missionDate('fecha-invalida')).toBe('Sin fecha');
    });
  });

  describe('tabs', () => {
    it('starts with reports tab selected', () => {
      expect(component.activeTab()).toBe('reports');
    });

    it('changes active tab to missions', () => {
      component.setTab('missions');

      expect(component.activeTab()).toBe('missions');
    });

    it('changes active tab to achievements', () => {
      component.setTab('achievements');

      expect(component.activeTab()).toBe('achievements');
    });
  });

  describe('profile edit route', () => {
    it('has edit profile route configured', () => {
      expect(component.rutaMiPerfil).toBe('/profile/edit');
    });
  });

  describe('my reports', () => {
    it('loads all the user reports including resolved and closed ones', async () => {
      const reportes = [
        mockReporte({ publicId: 'r-activo', status: 'ACTIVE' }),
        mockReporte({ publicId: 'r-resuelto', status: 'RESOLVED' }),
        mockReporte({ publicId: 'r-cerrado', status: 'CLOSED' }),
      ];

      reportListService.getMyReports.mockResolvedValue(reportes);

      await component.ngOnInit();

      expect(reportListService.getMyReports).toHaveBeenCalled();
      expect(component.reports()).toEqual(reportes);
      expect(component.reportsLoading()).toBe(false);
      expect(component.reportsError()).toBeNull();
    });

    it('shows an error when reports loading fails', async () => {
      reportListService.getMyReports.mockRejectedValue(
        new Error('No se pudieron cargar los reportes'),
      );

      await component.ngOnInit();

      expect(component.reportsError()).toBe('No se pudieron cargar los reportes');
      expect(component.reportsLoading()).toBe(false);
      expect(component.reports()).toEqual([]);
    });
  });

  describe('rating', () => {
    it('resets the rating summary when loading fails', async () => {
      profileService.getUserRating.mockRejectedValue(new Error('boom'));

      await component.loadRating();

      expect(component.ratingSummary()).toEqual({
        average: 0,
        count: 0,
      });
    });
  });

  describe('reviews', () => {
    it('shows an error when reviews loading fails', async () => {
      profileService.getMyReviews.mockRejectedValue(new Error('No se pudieron cargar las reseñas'));

      await component.loadReviews();

      expect(component.reviewsError()).toBe('No se pudieron cargar las reseñas');

      expect(component.reviewsLoading()).toBe(false);
    });
  });

  it('loads received and given reviews', async () => {
    profileService.getMyReviews.mockResolvedValue({
      received: {
        items: [
          {
            id: 1,
          },
        ],
      },
      given: {
        items: [
          {
            id: 2,
          },
        ],
      },
    });

    await component.loadReviews();

    expect(component.receivedReviews()).toHaveLength(1);
    expect(component.givenReviews()).toHaveLength(1);
  });

  describe('ratingStars', () => {
    it('rounds the average rating into stars', () => {
      component.ratingSummary.set({
        average: 3.6,
        count: 5,
      });

      expect(component.ratingStars()).toEqual(['★', '★', '★', '★', '☆']);
    });
  });
});
