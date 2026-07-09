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
import { of } from 'rxjs';
import { MissionOutput } from '../../infrastructure/models/mission.model';
import { Mock } from 'vitest';

describe('MissionDetailPage', () => {
  let component: MissionDetailPage;
  let fixture: ComponentFixture<MissionDetailPage>;
  let mockActivatedRoute: {
    snapshot: {
      paramMap: {
        get: Mock;
      };
    };
  };
  let mockRouter: {
    navigate: Mock;
    events: unknown;
    url: string;
  };
  let mockMissionService: {
    getMissions: Mock;
    joinMission: Mock;
    leaveMission: Mock;
    cancelMission: Mock;
    getMissionDetail: Mock;
  };
  let mockMissionUpdateService: {
    getUpdates: Mock;
    createUpdate: Mock;
    scoreUpdate: Mock;
    getCommentPointValues: Mock;
  };
  let mockAuthService: {
    getCurrentUserId: Mock;
  };
  let mockReportService: {
    getReportByPublicId: Mock;
  };
  let mockToastService: {
    success: Mock;
    error: Mock;
    award: Mock;
    brand: Mock;
  };
  let mockChatsService: {
    getOrCreateConversation: Mock;
  };

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
      createUpdate: vi.fn().mockReturnValue(of({})),
      scoreUpdate: vi.fn().mockReturnValue(of({})),
      getCommentPointValues: vi.fn().mockReturnValue(of([
        { points: 10, label: '+10 XP' },
        { points: 25, label: '+25 XP' },
        { points: 50, label: '+50 XP' }
      ]))
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
      error: vi.fn(),
      award: vi.fn(),
      brand: vi.fn()
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
      const missionData = { publicId: 'mission-123' } as unknown as MissionOutput;
      component.mission.set(missionData);

      await component.join();

      expect(mockMissionService.joinMission).toHaveBeenCalledWith('mission-123');
      expect(mockToastService.brand).toHaveBeenCalledWith('Te uniste a la misión con éxito');
    });

    it('debería abandonar la misión correctamente', async () => {
      const missionData = { publicId: 'mission-123' } as unknown as MissionOutput;
      component.mission.set(missionData);

      await component.leave();

      expect(mockMissionService.leaveMission).toHaveBeenCalledWith('mission-123');
      expect(mockToastService.success).toHaveBeenCalledWith('Abandonaste la misión');
    });
  });

  describe('método cancel', () => {
    it('debería cancelar la misión si el usuario confirma', async () => {
      const missionData = { publicId: 'mission-123' } as unknown as MissionOutput;
      component.mission.set(missionData);
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      await component.cancel();

      expect(mockMissionService.cancelMission).toHaveBeenCalledWith('mission-123');
      expect(mockToastService.success).toHaveBeenCalledWith('Misión cancelada con éxito');
    });

    it('no debería cancelar si el usuario no confirma', async () => {
      const missionData = { publicId: 'mission-123' } as unknown as MissionOutput;
      component.mission.set(missionData);
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      await component.cancel();

      expect(mockMissionService.cancelMission).not.toHaveBeenCalled();
    });
  });

  describe('método sendUpdate', () => {
    it('debería enviar una actualización y limpiar la caja de texto', async () => {
      const missionData = { publicId: 'mission-123' } as unknown as MissionOutput;
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
      const missionData = { publicId: 'mission-123' } as unknown as MissionOutput;
      component.mission.set(missionData);
      component.comment = '';

      await component.sendUpdate();

      expect(mockToastService.error).toHaveBeenCalledWith('Escribí un comentario');
      expect(mockMissionUpdateService.createUpdate).not.toHaveBeenCalled();
    });
  });

  describe('método rateUpdate y getPoints', () => {
    it('debería puntuar una actualización y retornar los puntos', async () => {
      await component.rateUpdate('update-1', 25);
      expect(component.getPoints('update-1')).toBe(25);
      expect(mockMissionUpdateService.scoreUpdate).toHaveBeenCalledWith('update-1', 25);
      expect(mockToastService.award).toHaveBeenCalledWith('¡Valoración enviada! Se otorgaron +25 XP');
    });
  });

  describe('valoración de comentarios (dueño vs otros)', () => {
    beforeEach(() => {
      component.mission.set({
        publicId: 'mission-123',
        title: 'Buscar a Firulais',
        description: 'Se perdió en Palermo',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        searchArea: { latitude: -34.6037, longitude: -58.3816, radius: 500 },
        report: { publicId: 'report-123', description: 'Perro perdido', type: 'LOST', status: 'ACTIVE', location: { latitude: -34.6037, longitude: -58.3816, address: 'Av Santa Fe 1234' } },
        volunteers: []
      } as unknown as MissionOutput);

      component.responses.set([
        {
          publicId: 'update-1',
          comment: 'Pista de prueba',
          photoUrl: null,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          user: {
            publicId: 'user-volunteer',
            username: 'voluntario1',
            photoUrl: null,
            name: 'Juan',
            lastname: 'Perez'
          },
          pointValue: null
        }
      ]);

      component.pointValues.set([
        { points: 10, label: '+10 XP' },
        { points: 25, label: '+25 XP' },
        { points: 50, label: '+50 XP' }
      ]);
    });

    it('debería mostrar los botones de puntuar al dueño si el comentario no ha sido valorado', () => {
      component.isOwner.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const rateButtons = Array.from(buttons).filter(b => b.textContent?.includes('+10 XP'));
      expect(rateButtons.length).toBe(1);

      const valLabel = compiled.textContent;
      expect(valLabel).not.toContain('Valorado:');
    });

    it('debería ocultar los botones de puntuar al dueño y mostrar la valoración si el comentario ya fue valorado', () => {
      component.isOwner.set(true);
      component.scores.set({ 'update-1': 25 });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const rateButtons = Array.from(buttons).filter(b => b.textContent?.includes('+10 XP'));
      expect(rateButtons.length).toBe(0);

      const text = compiled.textContent;
      expect(text).toContain('Valorado: +25 XP');
    });

    it('debería mostrar "Pendiente de valoración" a usuarios comunes si el comentario no ha sido valorado', () => {
      component.isOwner.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const text = compiled.textContent;
      expect(text).toContain('Pendiente de valoración');
      expect(text).not.toContain('Valorado:');
    });
  });

  describe('método editMission', () => {
    it('debería navegar a la página de edición de misión', () => {
      const missionData = { publicId: 'mission-123' } as unknown as MissionOutput;
      component.mission.set(missionData);

      component.editMission();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/missions/edit', 'mission-123']);
    });
  });
});
