import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { MissionDetailPage } from './mission-detail';
import { MissionService } from '../../application/mission.service';
import { MissionUpdateService } from '../../application/mission-update.service';
import { AuthService } from '../../../auth/application/auth.service';
import { ReportService } from '../../../report/application/report.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { ChatsService } from '../../../chats/application/chats.service';
import { of, throwError } from 'rxjs';

describe('MissionDetailPage', () => {
  let component: MissionDetailPage;
  let fixture: ComponentFixture<MissionDetailPage>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockMissionService: any;
  let mockMissionUpdateService: any;
  let mockAuthService: any;
  let mockReportService: any;
  let mockToastService: any;
  let mockChatsService: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('mission-123')
        }
      }
    };

    mockRouter = {
      navigate: vi.fn(),
      events: of(),
      url: ''
    };

    mockMissionService = {
      getMissions: vi.fn().mockReturnValue(of([])),
      joinMission: vi.fn().mockReturnValue(of({ status: 'OK', message: 'Success' })),
      leaveMission: vi.fn().mockReturnValue(of({ status: 'OK', message: 'Success' })),
      cancelMission: vi.fn().mockReturnValue(of({ status: 'OK', message: 'Success' })),
      getMissionDetail: vi.fn().mockReturnValue(of({
        publicId: 'mission-123',
        title: 'Buscar a Firulais',
        description: 'Se perdió en Palermo',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        searchArea: { latitude: -34.6037, longitude: -58.3816, radius: 500 },
        report: { publicId: 'report-123', description: 'Perro perdido', type: 'LOST', status: 'ACTIVE', location: { latitude: -34.6037, longitude: -58.3816, address: 'Av Santa Fe 1234' } },
        volunteers: []
      }))
    };

    mockMissionUpdateService = {
      getUpdates: vi.fn().mockReturnValue(of([])),
      createUpdate: vi.fn().mockReturnValue(of({}))
    };

    mockAuthService = {
      getCurrentUserId: vi.fn().mockReturnValue('user-volunteer')
    };

    mockReportService = {
      getReportByPublicId: vi.fn().mockResolvedValue({
        publicId: 'report-123',
        type: 'LOST',
        status: 'ACTIVE',
        details: { animalType: 'DOG' },
        user: { publicId: 'owner-456', username: 'pedro_owner', photoUrl: null }
      })
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    mockChatsService = {
      getOrCreateConversation: vi.fn().mockResolvedValue('conv-789')
    };

    await TestBed.configureTestingModule({
      imports: [MissionDetailPage],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MissionService, useValue: mockMissionService },
        { provide: MissionUpdateService, useValue: mockMissionUpdateService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ReportService, useValue: mockReportService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ChatsService, useValue: mockChatsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionDetailPage);
    component = fixture.componentInstance;
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('señal computada elapsedTime', () => {
    it('debería retornar "Cerrada" si el estado de la misión es CLOSED', () => {
      component.mission.set({
        publicId: 'm1',
        title: 'Título',
        description: 'Desc',
        status: 'CLOSED',
        createdAt: new Date(),
        updatedAt: null,
        searchArea: { latitude: 0, longitude: 0, radius: 100 },
        report: { publicId: 'r1', description: 'Desc', location: { address: '', latitude: 0, longitude: 0 }, photoUrl: null, title: 'Nombre', type: 'LOST', status: 'ACTIVE' },
        volunteers: []
      });

      expect(component.elapsedTime()).toBe('Cerrada');
    });

    it('debería retornar el tiempo relativo en días', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      component.mission.set({
        publicId: 'm1',
        title: 'Título',
        description: 'Desc',
        status: 'OPEN',
        createdAt: threeDaysAgo,
        updatedAt: null,
        searchArea: { latitude: 0, longitude: 0, radius: 100 },
        report: { publicId: 'r1', description: 'Desc', location: { address: '', latitude: 0, longitude: 0 }, photoUrl: null, title: 'Nombre', type: 'LOST', status: 'ACTIVE' },
        volunteers: []
      });

      expect(component.elapsedTime()).toBe('Activa hace 3 días');
    });

    it('debería retornar el tiempo relativo en horas', () => {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      component.mission.set({
        publicId: 'm1',
        title: 'Título',
        description: 'Desc',
        status: 'OPEN',
        createdAt: twoHoursAgo,
        updatedAt: null,
        searchArea: { latitude: 0, longitude: 0, radius: 100 },
        report: { publicId: 'r1', description: 'Desc', location: { address: '', latitude: 0, longitude: 0 }, photoUrl: null, title: 'Nombre', type: 'LOST', status: 'ACTIVE' },
        volunteers: []
      });

      expect(component.elapsedTime()).toBe('Activa hace 2 horas');
    });

    it('debería retornar el tiempo relativo en minutos', () => {
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      component.mission.set({
        publicId: 'm1',
        title: 'Título',
        description: 'Desc',
        status: 'OPEN',
        createdAt: fifteenMinutesAgo,
        updatedAt: null,
        searchArea: { latitude: 0, longitude: 0, radius: 100 },
        report: { publicId: 'r1', description: 'Desc', location: { address: '', latitude: 0, longitude: 0 }, photoUrl: null, title: 'Nombre', type: 'LOST', status: 'ACTIVE' },
        volunteers: []
      });

      expect(component.elapsedTime()).toBe('Activa hace 15 minutos');
    });
  });

  describe('método contactOwner', () => {
    it('debería llamar a ChatsService y navegar a /chats con el query param conversationId', async () => {
      component.owner.set({
        publicId: 'owner-456',
        username: 'pedro_owner',
        photoUrl: 'https://example.com/photo.jpg'
      });

      await component.contactOwner();

      expect(mockChatsService.getOrCreateConversation).toHaveBeenCalledWith('owner-456');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chats'], {
        queryParams: { conversation: 'conv-789' }
      });
    });

    it('debería mostrar un toast de error si ChatsService falla', async () => {
      component.owner.set({
        publicId: 'owner-456',
        username: 'pedro_owner',
        photoUrl: 'https://example.com/photo.jpg'
      });
      mockChatsService.getOrCreateConversation.mockRejectedValueOnce(new Error('API error'));

      await component.contactOwner();

      expect(mockToastService.error).toHaveBeenCalledWith('No se pudo abrir el chat');
    });
  });

  describe('métodos de unión y abandono de misión', () => {
    it('debería unirse a la misión correctamente', async () => {
      const missionData = { publicId: 'mission-123' } as any;
      component.mission.set(missionData);

      await component.join();

      expect(mockMissionService.joinMission).toHaveBeenCalledWith('mission-123');
      expect(mockToastService.success).toHaveBeenCalledWith('Te uniste a la misión con éxito');
    });

    it('debería abandonar la misión correctamente', async () => {
      const missionData = { publicId: 'mission-123' } as any;
      component.mission.set(missionData);

      await component.leave();

      expect(mockMissionService.leaveMission).toHaveBeenCalledWith('mission-123');
      expect(mockToastService.success).toHaveBeenCalledWith('Abandonaste la misión');
    });
  });

  describe('método cancel', () => {
    it('debería cancelar la misión si el usuario confirma', async () => {
      const missionData = { publicId: 'mission-123' } as any;
      component.mission.set(missionData);
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await component.cancel();

      expect(mockMissionService.cancelMission).toHaveBeenCalledWith('mission-123');
      expect(mockToastService.success).toHaveBeenCalledWith('Misión cancelada con éxito');
    });

    it('no debería cancelar si el usuario no confirma', async () => {
      const missionData = { publicId: 'mission-123' } as any;
      component.mission.set(missionData);
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      await component.cancel();

      expect(mockMissionService.cancelMission).not.toHaveBeenCalled();
    });
  });

  describe('método sendUpdate', () => {
    it('debería enviar una actualización y limpiar la caja de texto', async () => {
      const missionData = { publicId: 'mission-123' } as any;
      component.mission.set(missionData);
      component.comment = 'Nueva pista encontrada';

      await component.sendUpdate();

      expect(mockMissionUpdateService.createUpdate).toHaveBeenCalledWith({
        missionPublicId: 'mission-123',
        comment: 'Nueva pista encontrada',
        photoUrl: undefined
      });
      expect(component.comment).toBe('');
      expect(mockToastService.success).toHaveBeenCalledWith('Actualización enviada correctamente');
    });

    it('debería mostrar un error si la caja de comentarios está vacía', async () => {
      const missionData = { publicId: 'mission-123' } as any;
      component.mission.set(missionData);
      component.comment = '';

      await component.sendUpdate();

      expect(mockToastService.error).toHaveBeenCalledWith('Escribí un comentario');
      expect(mockMissionUpdateService.createUpdate).not.toHaveBeenCalled();
    });
  });

  describe('método rateUpdate y getPoints', () => {
    it('debería puntuar una actualización y retornar los puntos', () => {
      component.rateUpdate('update-1', 25);
      expect(component.getPoints('update-1')).toBe(25);
      expect(mockToastService.success).toHaveBeenCalledWith('¡Valoración enviada! Se otorgaron +25 XP');
    });
  });

  describe('método editMission', () => {
    it('debería navegar a la página de edición de misión', () => {
      const missionData = { publicId: 'mission-123' } as any;
      component.mission.set(missionData);

      component.editMission();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/missions/edit', 'mission-123']);
    });
  });
});
