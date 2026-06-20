import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReportContactComponent } from './report-contact';
import { ChatsService } from '../../../../chats/application/chats.service';
import { ToastService } from '../../../../../shared/application/toast.service';
import { ReportDetail } from '../../../infrastructure/report.http';

function makeReportDetail(overrides: Partial<ReportDetail> = {}): ReportDetail {
  return {
    publicId: 'report-1',
    type: 'SIGHTING',
    status: 'ACTIVE',
    description: 'desc',
    createdAt: '2024-01-01T00:00:00.000Z',
    occurredAt: '2024-01-01T10:00:00.000Z',
    updatedAt: null,
    location: { address: 'Calle 1', latitude: 0, longitude: 0 },
    details: { animalType: 'DOG', color: 'negro', hasIdCollar: false, isInTransit: false, images: [] },
    user: { publicId: 'owner-1', username: 'ana', photoUrl: null },
    ...overrides,
  };
}

describe('ReportContactComponent', () => {
  let fixture: ComponentFixture<ReportContactComponent>;
  let component: ReportContactComponent;
  let chatsService: { getOrCreateConversation: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    chatsService = { getOrCreateConversation: vi.fn() };
    toastService = { error: vi.fn(), success: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ReportContactComponent],
      providers: [
        { provide: ChatsService, useValue: chatsService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(ReportContactComponent);
    component = fixture.componentInstance;
  });

  it('abre el chat con el dueño del reporte al enviar mensaje', async () => {
    fixture.componentRef.setInput('report', makeReportDetail({ user: { publicId: 'owner-1', username: 'ana', photoUrl: null } }));
    chatsService.getOrCreateConversation.mockResolvedValue('conv-7');

    await component.enviarMensaje();

    expect(chatsService.getOrCreateConversation).toHaveBeenCalledWith('owner-1');
    expect(router.navigate).toHaveBeenCalledWith(['/chats'], { queryParams: { conversation: 'conv-7' } });
  });

  it('muestra un toast si no se puede abrir el chat', async () => {
    fixture.componentRef.setInput('report', makeReportDetail());
    chatsService.getOrCreateConversation.mockRejectedValue(new Error('x'));

    await component.enviarMensaje();

    expect(toastService.error).toHaveBeenCalledWith('No se pudo abrir el chat');
  });

  it('navega a las coincidencias del reporte', () => {
    fixture.componentRef.setInput('report', makeReportDetail({ publicId: 'report-9' }));

    component.goToMatches();

    expect(router.navigate).toHaveBeenCalledWith(['/reports', 'report-9', 'matches']);
  });
});
