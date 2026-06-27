import { Component, computed, signal } from '@angular/core';

type ModerationStatus = 'pending' | 'approved' | 'deleted' | 'suspended' | 'dismissed';
type ModerationFilter = 'pending' | 'resolved';
type AdminSection = 'reports' | 'chats';

interface ReportedPublication {
  id: string;
  title: string;
  reportType: 'LOST' | 'SIGHTING';
  author: string;
  description: string;
  reason: string;
  reportedBy: string;
  reportedAt: string;
  status: ModerationStatus;
}

interface ReportedChat {
  id: string;
  reportedUser: string;
  reporter: string;
  reason: string;
  excerpt: string;
  reportedAt: string;
  status: ModerationStatus;
}

type PublicationAction = 'approve' | 'delete' | 'suspend';

interface PendingConfirmation {
  kind: 'publication';
  action: PublicationAction;
  id: string;
  label: string;
  description: string;
}

const MOCK_PUBLICATIONS: ReportedPublication[] = [
  {
    id: 'p1',
    title: 'Perro perdido en Palermo',
    reportType: 'LOST',
    author: 'martin_g',
    description: 'Se perdió mi perro Rocky, raza labrador, color dorado, zona Palermo.',
    reason: 'Información falsa o engañosa',
    reportedBy: 'vecina_22',
    reportedAt: 'Hace 2 hs',
    status: 'pending',
  },
  {
    id: 'p2',
    title: 'Gato avistado',
    reportType: 'SIGHTING',
    author: 'lucas.p',
    description: 'Vi un gato naranja cerca de la plaza, parece perdido.',
    reason: 'Contenido inapropiado',
    reportedBy: 'ana.m',
    reportedAt: 'Hace 5 hs',
    status: 'pending',
  },
  {
    id: 'p3',
    title: 'Perro en tránsito',
    reportType: 'SIGHTING',
    author: 'refugio_norte',
    description: 'Tengo en tránsito a una perrita mestiza, busca su familia.',
    reason: 'Spam o publicidad',
    reportedBy: 'pedro_l',
    reportedAt: 'Ayer',
    status: 'pending',
  },
  {
    id: 'p4',
    title: 'Gato perdido en Caballito',
    reportType: 'LOST',
    author: 'flor_99',
    description: 'Mi gato siamés se escapó por la ventana.',
    reason: 'Reporte duplicado',
    reportedBy: 'juan_c',
    reportedAt: 'Hace 3 días',
    status: 'approved',
  },
];

const MOCK_CHATS: ReportedChat[] = [
  {
    id: 'c1',
    reportedUser: 'usuario_anon',
    reporter: 'martin_g',
    reason: 'Fraude o estafa',
    excerpt: 'Pasame los datos de tu tarjeta y te devuelvo la mascota...',
    reportedAt: 'Hace 1 h',
    status: 'pending',
  },
  {
    id: 'c2',
    reportedUser: 'fake_profile',
    reporter: 'ana.m',
    reason: 'Suplantación de identidad',
    excerpt: 'Soy del refugio oficial, transferí la seña primero.',
    reportedAt: 'Hace 6 hs',
    status: 'pending',
  },
  {
    id: 'c3',
    reportedUser: 'troll_123',
    reporter: 'lucas.p',
    reason: 'Comportamiento sospechoso',
    excerpt: 'Mensajes ofensivos repetidos hacia el dueño.',
    reportedAt: 'Hace 2 días',
    status: 'suspended',
  },
];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  host: { class: 'flex flex-1 min-h-0' },
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardComponent {
  readonly section = signal<AdminSection>('reports');
  readonly publicationFilter = signal<ModerationFilter>('pending');
  readonly chatFilter = signal<ModerationFilter>('pending');

  readonly publications = signal<ReportedPublication[]>(MOCK_PUBLICATIONS);
  readonly chats = signal<ReportedChat[]>(MOCK_CHATS);

  readonly detailPublication = signal<ReportedPublication | null>(null);
  readonly detailChat = signal<ReportedChat | null>(null);
  readonly confirmation = signal<PendingConfirmation | null>(null);

  readonly pendingPublications = computed(
    () => this.publications().filter((p) => p.status === 'pending').length,
  );
  readonly pendingChats = computed(
    () => this.chats().filter((c) => c.status === 'pending').length,
  );

  readonly visiblePublications = computed(() => {
    const onlyPending = this.publicationFilter() === 'pending';
    return this.publications().filter((p) =>
      onlyPending ? p.status === 'pending' : p.status !== 'pending',
    );
  });

  readonly visibleChats = computed(() => {
    const onlyPending = this.chatFilter() === 'pending';
    return this.chats().filter((c) =>
      onlyPending ? c.status === 'pending' : c.status !== 'pending',
    );
  });

  selectSection(section: AdminSection): void {
    this.section.set(section);
  }

  setPublicationFilter(filter: ModerationFilter): void {
    this.publicationFilter.set(filter);
  }

  setChatFilter(filter: ModerationFilter): void {
    this.chatFilter.set(filter);
  }

  openPublication(publication: ReportedPublication): void {
    this.detailPublication.set(publication);
  }

  openChat(chat: ReportedChat): void {
    this.detailChat.set(chat);
  }

  closeDetail(): void {
    this.detailPublication.set(null);
    this.detailChat.set(null);
  }

  approve(publication: ReportedPublication): void {
    this.applyPublicationStatus(publication.id, 'approved');
  }

  askDelete(publication: ReportedPublication): void {
    this.confirmation.set({
      kind: 'publication',
      action: 'delete',
      id: publication.id,
      label: 'Eliminar publicación',
      description: `Vas a eliminar "${publication.title}". Esta acción no se puede deshacer.`,
    });
  }

  askSuspend(publication: ReportedPublication): void {
    this.confirmation.set({
      kind: 'publication',
      action: 'suspend',
      id: publication.id,
      label: 'Suspender publicación',
      description: `Vas a suspender "${publication.title}" hasta su revisión.`,
    });
  }

  confirmAction(): void {
    const pending = this.confirmation();
    if (!pending) return;
    if (pending.action === 'delete') this.applyPublicationStatus(pending.id, 'deleted');
    if (pending.action === 'suspend') this.applyPublicationStatus(pending.id, 'suspended');
    this.cancelConfirmation();
  }

  cancelConfirmation(): void {
    this.confirmation.set(null);
  }

  suspendUser(chat: ReportedChat): void {
    this.applyChatStatus(chat.id, 'suspended');
  }

  dismissChat(chat: ReportedChat): void {
    this.applyChatStatus(chat.id, 'dismissed');
  }

  statusLabel(status: ModerationStatus): string {
    const labels: Record<ModerationStatus, string> = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      deleted: 'Eliminada',
      suspended: 'Suspendida',
      dismissed: 'Descartado',
    };
    return labels[status];
  }

  typeLabel(type: 'LOST' | 'SIGHTING'): string {
    return type === 'LOST' ? 'Perdido' : 'Avistamiento';
  }

  statusBadgeClass(status: ModerationStatus): string {
    const map: Record<ModerationStatus, string> = {
      pending: 'bg-[#E8842E]/10 text-[#E8842E]',
      approved: 'bg-[#1D6FA3]/10 text-[#1D6FA3]',
      deleted: 'bg-[#b04632]/10 text-[#b04632]',
      suspended: 'bg-[#12355B]/10 text-[#12355B]',
      dismissed: 'bg-slate-100 text-slate-500',
    };
    return map[status];
  }

  private applyPublicationStatus(id: string, status: ModerationStatus): void {
    this.publications.update((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    this.closeDetail();
  }

  private applyChatStatus(id: string, status: ModerationStatus): void {
    this.chats.update((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    this.closeDetail();
  }
}
