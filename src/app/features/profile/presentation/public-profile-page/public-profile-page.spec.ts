import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicProfilePage } from './public-profile-page';
import { ProfileService } from '../../application/profile.service';
import { ReportListService } from '../../../report/application/report-list.service';
import { PublicProfile } from '../../domain/public-profile';
import { AuthService } from '../../../auth/application/auth.service';

describe('PublicProfilePage', () => {
  let component: PublicProfilePage;
  let fixture: ComponentFixture<PublicProfilePage>;
  let profileService: { getPublicProfile: ReturnType<typeof vi.fn> };
  let reportListService: { getReportesDeUsuario: ReturnType<typeof vi.fn> };
  let authService: { getCurrentUserId: ReturnType<typeof vi.fn> };
  let publicIdParam: string | null;

  const fakeProfile: PublicProfile = {
    id: 'u-1',
    username: 'juan',
    name: 'Juan',
    lastname: 'Pérez',
    photoUrl: null,
  };

  beforeEach(() => {
    publicIdParam = 'u-1';
    profileService = { getPublicProfile: vi.fn().mockResolvedValue(fakeProfile) };
    reportListService = { getReportesDeUsuario: vi.fn().mockResolvedValue([]) };
    authService = { getCurrentUserId: vi.fn().mockReturnValue('me-999') };

    TestBed.configureTestingModule({
      imports: [PublicProfilePage],
      providers: [
        { provide: ProfileService, useValue: profileService },
        { provide: ReportListService, useValue: reportListService },
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

  it('carga el perfil y los reportes del usuario de la ruta', async () => {
    await component.ngOnInit();

    expect(profileService.getPublicProfile).toHaveBeenCalledWith('u-1');
    expect(reportListService.getReportesDeUsuario).toHaveBeenCalledWith('u-1');
    expect(component.profile()).toEqual(fakeProfile);
    expect(component.loading()).toBe(false);
    expect(component.reportsLoading()).toBe(false);
  });

  it('muestra error y no llama a los servicios si no hay publicId en la ruta', async () => {
    publicIdParam = null;

    await component.ngOnInit();

    expect(profileService.getPublicProfile).not.toHaveBeenCalled();
    expect(component.serverError()).toBe('Usuario no encontrado');
  });

  it('setea serverError si falla la carga del perfil', async () => {
    profileService.getPublicProfile.mockRejectedValue(new Error('No se pudo cargar el perfil'));

    await component.ngOnInit();

    expect(component.serverError()).toBe('No se pudo cargar el perfil');
    expect(component.loading()).toBe(false);
  });

  it('setea reportsError si falla la carga de reportes', async () => {
    reportListService.getReportesDeUsuario.mockRejectedValue(
      new Error('No se pudieron cargar los reportes'),
    );

    await component.ngOnInit();

    expect(component.reportsError()).toBe('No se pudieron cargar los reportes');
  });

  it('displayName arma el nombre completo o cae al username', async () => {
    await component.ngOnInit();
    expect(component.displayName()).toBe('Juan Pérez');

    component.profile.set({ ...fakeProfile, name: null, lastname: null });
    expect(component.displayName()).toBe('juan');
  });

  it('setTab cambia la pestaña activa', () => {
    component.setTab('missions');
    expect(component.activeTab()).toBe('missions');
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
});
