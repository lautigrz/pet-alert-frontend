import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { PublicProfilePage } from './public-profile-page';
import { ProfileService } from '../../application/profile.service';
import { ReportListService } from '../../../report/application/report-list.service';
import { PublicProfile } from '../../domain/public-profile';
import { AuthService } from '../../../auth/application/auth.service';
import { MissionService } from '../../../missions/application/mission.service';
import { MissionOutput } from '../../../missions/infrastructure/models/mission.model';

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

describe('PublicProfilePage', () => {
  let component: PublicProfilePage;
  let fixture: ComponentFixture<PublicProfilePage>;

  let profileService: {
    getPublicProfile: ReturnType<typeof vi.fn>;
    getUserRating: ReturnType<typeof vi.fn>;
    getUserReviews: ReturnType<typeof vi.fn>;
    createUserReview: ReturnType<typeof vi.fn>;
    getPublicUserExperience: ReturnType<typeof vi.fn>;
  };

  let reportListService: {
    getUserReports: ReturnType<typeof vi.fn>;
  };

  let missionService: {
    getJoinedMissionsByUser: ReturnType<typeof vi.fn>;
  };

  let authService: {
    getCurrentUserId: ReturnType<typeof vi.fn>;
  };

  let publicIdParam: string | null;

  const fakeProfile: PublicProfile = {
    id: 'u-1',
    username: 'juan',
    name: 'Juan',
    lastname: 'Pérez',
    photoUrl: null,
    stats: null,
  };

  beforeEach(() => {
    publicIdParam = 'u-1';

    profileService = {
      getPublicProfile: vi.fn().mockResolvedValue(fakeProfile),
      getUserRating: vi.fn().mockResolvedValue({ average: 4.5, count: 2 }),
      getUserReviews: vi.fn().mockResolvedValue({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
      }),
      createUserReview: vi.fn().mockResolvedValue({
        id: 1,
        rating: 5,
        description: 'Muy buena experiencia',
        createdAt: '',
        updatedAt: '',
        reviewer: fakeProfile,
      }),
      getPublicUserExperience: vi.fn().mockResolvedValue({
        xp: 0,
        level: 1,
        unlockedAchievements: [],
      }),
    };

    reportListService = {
      getUserReports: vi.fn().mockResolvedValue([]),
    };

    missionService = {
      getJoinedMissionsByUser: vi.fn().mockReturnValue(of([])),
    };

    authService = {
      getCurrentUserId: vi.fn().mockReturnValue('me-999'),
    };

    TestBed.configureTestingModule({
      imports: [PublicProfilePage],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: profileService },
        { provide: ReportListService, useValue: reportListService },
        { provide: MissionService, useValue: missionService },
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => publicIdParam } } },
        },
      ],
    });

    fixture = TestBed.createComponent(PublicProfilePage);
    component = fixture.componentInstance;
  });

  it('carga el perfil, reportes, rating, reseñas, experiencia y misiones del usuario de la ruta', async () => {
    await component.ngOnInit();

    expect(profileService.getPublicProfile).toHaveBeenCalledWith('u-1');
    expect(reportListService.getUserReports).toHaveBeenCalledWith('u-1');
    expect(profileService.getUserRating).toHaveBeenCalledWith('u-1');
    expect(profileService.getUserReviews).toHaveBeenCalledWith('u-1');
    expect(profileService.getPublicUserExperience).toHaveBeenCalledWith('u-1');
    expect(missionService.getJoinedMissionsByUser).toHaveBeenCalledWith('u-1');

    expect(component.profile()).toEqual(fakeProfile);
    expect(component.loading()).toBe(false);
    expect(component.reportsLoading()).toBe(false);
    expect(component.missionsLoading()).toBe(false);
  });

  it('muestra error y no llama a los servicios si no hay publicId en la ruta', async () => {
    publicIdParam = null;

    await component.ngOnInit();

    expect(profileService.getPublicProfile).not.toHaveBeenCalled();
    expect(reportListService.getUserReports).not.toHaveBeenCalled();
    expect(missionService.getJoinedMissionsByUser).not.toHaveBeenCalled();
    expect(component.serverError()).toBe('Usuario no encontrado');
  });

  it('setea serverError si falla la carga del perfil', async () => {
    profileService.getPublicProfile.mockRejectedValue(new Error('No se pudo cargar el perfil'));

    await component.ngOnInit();

    expect(component.serverError()).toBe('No se pudo cargar el perfil');
    expect(component.loading()).toBe(false);
  });

  it('setea reportsError si falla la carga de reportes', async () => {
    reportListService.getUserReports.mockRejectedValue(
      new Error('No se pudieron cargar los reportes'),
    );

    await component.ngOnInit();

    expect(component.reportsError()).toBe('No se pudieron cargar los reportes');
  });

  it('carga las misiones del usuario público', async () => {
    const mission = mockMission();

    missionService.getJoinedMissionsByUser.mockReturnValue(of([mission]));

    await component.ngOnInit();

    expect(missionService.getJoinedMissionsByUser).toHaveBeenCalledWith('u-1');
    expect(component.missions()).toEqual([mission]);
    expect(component.missionsLoading()).toBe(false);
    expect(component.missionsError()).toBeNull();
  });

  it('setea missionsError si falla la carga de misiones', async () => {
    missionService.getJoinedMissionsByUser.mockReturnValue(
      throwError(() => new Error('No se pudieron cargar las misiones')),
    );

    await component.ngOnInit();

    expect(component.missionsError()).toBe('No se pudieron cargar las misiones');
    expect(component.missionsLoading()).toBe(false);
    expect(component.missions()).toEqual([]);
  });

  it('traduce los estados de misión', () => {
    expect(component.missionStatusLabel('OPEN')).toBe('Abierta');
    expect(component.missionStatusLabel('IN_PROGRESS')).toBe('En progreso');
    expect(component.missionStatusLabel('CLOSED')).toBe('Cerrada');
  });

  it('formatea la fecha de misión', () => {
    expect(component.missionDate(new Date('2026-07-08T10:00:00.000Z'))).toBe('08/07/2026');
  });

  it('displayName arma el nombre completo o cae al username', async () => {
    await component.ngOnInit();

    expect(component.displayName()).toBe('Juan Pérez');

    component.profile.set({ ...fakeProfile, name: null, lastname: null });

    expect(component.displayName()).toBe('juan');
  });

  it('setTab cambia la pestaña activa', () => {
    component.setTab('reviews');

    expect(component.activeTab()).toBe('reviews');
  });

  it('esPropio es false cuando el perfil es de otro usuario', async () => {
    await component.ngOnInit();

    expect(component.esPropio()).toBe(false);
  });

  it('esPropio es true cuando el perfil es del usuario logueado', async () => {
    authService.getCurrentUserId.mockReturnValue('u-1');

    await component.ngOnInit();

    expect(component.esPropio()).toBe(true);
  });

  it('abre y cierra el modal de denuncia', () => {
    expect(component.mostrandoModalDenuncia()).toBe(false);

    component.abrirModalDenuncia();
    expect(component.mostrandoModalDenuncia()).toBe(true);

    component.cerrarModalDenuncia();
    expect(component.mostrandoModalDenuncia()).toBe(false);
  });

  it('envía una reseña y recarga rating y listado', async () => {
    await component.ngOnInit();

    component.setReviewRating(5);
    component.reviewDescription.set('Muy buena experiencia');

    await component.enviarReview();

    expect(profileService.createUserReview).toHaveBeenCalledWith({
      reviewedUserId: 'u-1',
      rating: 5,
      description: 'Muy buena experiencia',
    });

    expect(component.activeTab()).toBe('reviews');
    expect(component.reviewSheetOpen()).toBe(false);
  });

  it('no envía la reseña cuando no hay una calificación seleccionada', async () => {
    await component.ngOnInit();

    component.reviewDescription.set('Muy buena experiencia');

    await component.enviarReview();

    expect(profileService.createUserReview).not.toHaveBeenCalled();
    expect(component.reviewSubmitError()).toBe('Elegí una calificación antes de enviar.');
  });

  it('muestra el error cuando falla el envío de la reseña', async () => {
    await component.ngOnInit();

    profileService.createUserReview.mockRejectedValue(new Error('No se pudo enviar la reseña'));

    component.setReviewRating(5);
    component.reviewDescription.set('Excelente');

    await component.enviarReview();

    expect(component.reviewSubmitError()).toBe('No se pudo enviar la reseña');
    expect(component.reviewSubmitting()).toBe(false);
  });

  it('abre el formulario de reseña limpiando errores anteriores', () => {
    component.reviewSubmitError.set('Error anterior');

    component.abrirReviewSheet();

    expect(component.reviewSheetOpen()).toBe(true);
    expect(component.reviewSubmitError()).toBeNull();
  });

  it('no cierra el formulario mientras la reseña se está enviando', () => {
    component.reviewSheetOpen.set(true);
    component.reviewSubmitting.set(true);

    component.cerrarReviewSheet();

    expect(component.reviewSheetOpen()).toBe(true);
  });
});
