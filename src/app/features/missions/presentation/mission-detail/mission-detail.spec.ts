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
      navigate: vi.fn()
    };

    mockMissionService = {
      getMissions: vi.fn().mockReturnValue(of([])),
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
      getMissionUpdates: vi.fn().mockResolvedValue([])
    };

    mockAuthService = {
      getCurrentUserId: vi.fn().mockReturnValue('user-volunteer')
    };

    mockReportService = {
      getReportByPublicId: vi.fn().mockResolvedValue({
        publicId: 'report-123',
        type: 'LOST',
        status: 'ACTIVE',
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

  describe('señal computada tiempoTranscurrido', () => {
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

      expect(component.tiempoTranscurrido()).toBe('Cerrada');
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

      expect(component.tiempoTranscurrido()).toBe('Activa hace 3 días');
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

      expect(component.tiempoTranscurrido()).toBe('Activa hace 2 horas');
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

      expect(component.tiempoTranscurrido()).toBe('Activa hace 15 minutos');
    });
  });

  describe('método contactarDueno', () => {
    it('debería llamar a ChatsService y navegar a /chats con el query param conversationId', async () => {
      component.owner.set({
        publicId: 'owner-456',
        username: 'pedro_owner'
      });

      await component.contactarDueno();

      expect(mockChatsService.getOrCreateConversation).toHaveBeenCalledWith('owner-456');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chats'], {
        queryParams: { conversation: 'conv-789' }
      });
    });

    it('debería mostrar un toast de error si ChatsService falla', async () => {
      component.owner.set({
        publicId: 'owner-456',
        username: 'pedro_owner'
      });
      mockChatsService.getOrCreateConversation.mockRejectedValueOnce(new Error('API error'));

      await component.contactarDueno();

      expect(mockToastService.error).toHaveBeenCalledWith('No se pudo abrir el chat');
    });
  });
});
