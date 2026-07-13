import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { MissionService } from '../../application/mission.service';
import { MissionUpdateService } from '../../application/mission-update.service';
import { MissionCoverageService } from '../../application/mission-coverage.service';
import { AuthService } from '../../../auth/application/auth.service';
import { ReportService } from '../../../report/application/report.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { ChatsService } from '../../../chats/application/chats.service';
import { MissionOutput } from '../../infrastructure/models/mission.model';
import { MissionUpdateOutput, CommentPointValueOutput } from '../../infrastructure/mission-update.http';
import { FormsModule } from '@angular/forms';
import { MissionStatusMapper, UpdateStatusMapper } from '../mission-status.mapper';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mission-detail.html',
  styleUrls: []
})
export class MissionDetailPage implements OnInit, OnDestroy {

  protected readonly MissionStatusMapper = MissionStatusMapper;
  protected readonly UpdateStatusMapper = UpdateStatusMapper;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly missionService = inject(MissionService);
  private readonly missionUpdateService = inject(MissionUpdateService);
  private readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly toastService = inject(ToastService);
  private readonly chatsService = inject(ChatsService);
  protected readonly missionCoverageService = inject(MissionCoverageService);

  constructor() {
    effect(() => {
      const points = this.missionCoverageService.coveragePoints();
      if (this.heatLayer) {
        this.heatLayer.setLatLngs(points);
        this.heatLayer.redraw();
      }
    });

    effect(() => {
      const loc = this.missionCoverageService.userLocation();
      if (!this.map) return;

      if (loc) {
        const [lat, lng] = loc;
        if (this.userMarker) {
          this.userMarker.setLatLng([lat, lng]);
        } else {

          const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: '<div class="user-marker-pulse"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
        }
      } else {
        if (this.userMarker) {
          this.userMarker.remove();
          this.userMarker = undefined;
        }
      }
    });
  }

  readonly mission = signal<MissionOutput | null>(null);
  readonly responses = signal<MissionUpdateOutput[]>([]);
  readonly pointValues = signal<CommentPointValueOutput[]>([]);
  readonly currentUserId = signal<string | null>(null);
  readonly isVolunteer = signal<boolean>(false);
  readonly isOwner = signal<boolean>(false);
  readonly ownerId = signal<string | null>(null);
  readonly owner = signal<{
    publicId: string;
    username: string;
    photoUrl: string | null;
  } | null>(null);
  readonly animalType = signal<'DOG' | 'CAT' | null>(null);
  readonly visitedCount = computed(() => this.missionCoverageService.visitedCount());
  readonly allCellsCount = computed(() => this.missionCoverageService.allCellsCount());

  readonly elapsedTime = computed(() => {
    const m = this.mission();
    if (!m) return '';
    if (MissionStatusMapper.isClosed(m.status)) return 'Cerrada';

    const createdDate = new Date(m.createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    if (diffTime < 0) return 'Activa hace unos instantes';

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `Activa hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    } else if (diffHours > 0) {
      return `Activa hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `Activa hace ${diffMinutes > 0 ? diffMinutes : 1} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    }
  });

  readonly isTrackingActive = signal<boolean>(false);
  readonly activeImage = signal<string | null>(null);
  readonly removingVolunteerId = signal<string | null>(null);

  private map?: L.Map;
  private circle?: L.Circle;
  private marker?: L.Marker;
  private heatLayer?: L.HeatLayer;
  private userMarker?: L.Marker;

  comment = '';
  image?: File;

  async ngOnInit(): Promise<void> {
    const publicId = this.route.snapshot.paramMap.get('publicId') || '';
    if (publicId) {
      await this.loadMission(publicId);
      await this.loadResponses(publicId);
      await this.loadPointValues();
    }
  }

  async loadMission(publicId: string): Promise<void> {
    try {
      const m = await firstValueFrom(this.missionService.getMissionDetail(publicId));
      this.mission.set(m);

      const userId = this.authService.getCurrentUserId();
      this.currentUserId.set(userId);

      const volunteers = m.volunteers || [];
      this.isVolunteer.set(volunteers.some(v => v.publicId === userId));

      const reportDetail = await this.reportService.getReportByPublicId(m.report.publicId);
      this.owner.set(reportDetail.user);
      this.ownerId.set(reportDetail.user.publicId);
      this.isOwner.set(reportDetail.user.publicId === userId);
      this.animalType.set(reportDetail.details.animalType);

      this.initializeMap(m);
      if ((this.isVolunteer() || this.isOwner()) && !MissionStatusMapper.isClosed(m.status)) {
        this.missionCoverageService.startTracking(
          m.publicId,
          m.searchArea.latitude,
          m.searchArea.longitude,
          m.searchArea.radius,
          this.isTrackingActive()
        );
      }
    } catch (error) {
      console.error('Error loading mission details:', error);
    }
  }

  async loadResponses(publicId: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.missionUpdateService.getUpdates(publicId));
      this.responses.set(data);
    } catch (error) {
      console.error('Error loading mission updates:', error);
    }
  }

  async loadPointValues(): Promise<void> {
    try {
      const points = await firstValueFrom(this.missionUpdateService.getCommentPointValues());
      this.pointValues.set(points);
    } catch (error) {
      console.error('Error loading point values:', error);
    }
  }

  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.image = input.files[0];
    }
  }

  async join(): Promise<void> {
    const m = this.mission();
    if (!m) return;

    try {
      await firstValueFrom(this.missionService.joinMission(m.publicId));
      this.toastService.brand("Te uniste a la misión con éxito");
      await this.loadMission(m.publicId);
    } catch {
      this.toastService.error("No se pudo unir a la misión");
    }
  }

  async leave(): Promise<void> {
    const m = this.mission();
    if (!m) return;

    try {
      await firstValueFrom(this.missionService.leaveMission(m.publicId));
      this.isTrackingActive.set(false);
      this.missionCoverageService.stopTracking();
      this.toastService.success("Abandonaste la misión");
      await this.loadMission(m.publicId);
    } catch (error) {
      console.error(error);
      this.toastService.error(error instanceof Error ? error.message : "No se pudo abandonar la misión");
    }
  }

  async removeVolunteer(volunteerPublicId: string): Promise<void> {
    const m = this.mission();

    if(!m || !this.isOwner() || MissionStatusMapper.isClosed(m.status)){
      return;
    }

    const confirmed = confirm("¿Estás seguro de que deseas eliminar a este voluntario de la misión?");
    if (!confirmed) {
      return;
    }
    this.removingVolunteerId.set(volunteerPublicId);

    try{
      await firstValueFrom(this.missionService.removeVolunteer(m.publicId, volunteerPublicId));
      this.toastService.success("Voluntario eliminado de la misión");

      this.mission.update((current) =>
      current
        ? {
            ...current,
            volunteers: current.volunteers.filter((volunteer) => volunteer.publicId !== volunteerPublicId),
        }
        : current
      );
    } catch (error) {
      this.toastService.error(error instanceof Error ? error.message : "No se pudo eliminar al voluntario de la misión");
    } finally {
      this.removingVolunteerId.set(null);
    }
  }

  async cancel(): Promise<void> {
    const m = this.mission();
    if (!m) return;

    if (!confirm("¿Estás seguro de que deseas cerrar/cancelar esta misión?")) return;

    try {
      await firstValueFrom(this.missionService.cancelMission(m.publicId));
      this.isTrackingActive.set(false);
      this.missionCoverageService.stopTracking();
      this.toastService.success("Misión cancelada con éxito");
      await this.loadMission(m.publicId);
    } catch (error) {
      console.error(error);
      this.toastService.error(error instanceof Error ? error.message : "No se pudo cancelar la misión");
    }
  }

  toggleTracking(): void {
    const m = this.mission();
    if (!m) return;

    const nextState = !this.isTrackingActive();
    this.isTrackingActive.set(nextState);

    this.missionCoverageService.startTracking(
      m.publicId,
      m.searchArea.latitude,
      m.searchArea.longitude,
      m.searchArea.radius,
      nextState
    );

    if (nextState) {
      this.toastService.brand("Búsqueda iniciada. Tu GPS registrará tu recorrido.");
    } else {
      this.toastService.success("Búsqueda pausada. Se detuvo el GPS.");
    }
  }

  async sendUpdate(): Promise<void> {
    const m = this.mission();
    if (!m) return;

    if (!this.comment.trim()) {
      this.toastService.error("Escribí un comentario");
      return;
    }

    try {
      await firstValueFrom(
        this.missionUpdateService.createUpdate({
          missionPublicId: m.publicId,
          comment: this.comment,
          photoUrl: undefined,
          photo: this.image
        })
      );
      this.comment = '';
      this.image = undefined;
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      this.toastService.success("Actualización enviada correctamente");
      await this.loadResponses(m.publicId);
    } catch (error) {
      console.error(error);
      this.toastService.error(error instanceof Error ? error.message : "No se pudo enviar la actualización");
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    this.missionCoverageService.stopTracking();
  }

  editMission(): void {
    const m = this.mission();
    if (!m) return;
    this.router.navigate(['/missions/edit', m.publicId]);
  }

  goToReport(): void {
    const m = this.mission();
    if (!m) return;
    this.router.navigate(['/reports', m.report.publicId], {
      state: { fromMission: m.publicId }
    });
  }

  async initializeMap(m: MissionOutput): Promise<void> {
    const lat = m.searchArea.latitude;
    const lng = m.searchArea.longitude;
    const radius = m.searchArea.radius;

    if (typeof window !== 'undefined') {
      const windowWithL = window as unknown as { L: typeof L };
      windowWithL.L = Object.create(L);
      await import('leaflet.heat');
    }

    setTimeout(() => {
      if (this.map) {
        this.map.remove();
      }

      const container = document.getElementById('detailMap');
      if (!container) {
        return;
      }

      this.map = L.map(container, {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      const isLost = m.report?.type === 'LOST';

      this.circle = L.circle([lat, lng], {
        radius: radius,
        color: isLost ? '#E8842E' : '#12355B',
        fillColor: isLost ? '#E8842E' : '#1D6FA3',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(this.map);

      const image = m.report.photoUrl ?? m.report.petDetails?.photoUrl ?? '';

      this.marker = L.marker([lat, lng], {
        icon: this.buildMissionIcon(image, isLost)
      }).addTo(this.map);

      const points = this.missionCoverageService.coveragePoints();
      const windowWithL = window as unknown as { L: typeof L };
      this.heatLayer = windowWithL.L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17
      }).addTo(this.map);

      this.map.fitBounds(this.circle.getBounds(), { padding: [20, 20] });
    }, 100);
  }

  private buildMissionIcon(imageUrl: string, isLost = false): L.DivIcon {
    const color = isLost ? '#E8842E' : '#12355B';
    return L.divIcon({
      html: `
        <div class="relative w-11 h-11 rounded-full border-3 bg-white shadow-md overflow-hidden flex items-center justify-center" style="border-color:${color}">
          ${imageUrl
          ? `<img src="${imageUrl}" class="w-full h-full object-cover">`
          : `<span class="text-sm font-bold" style="color:${color}">🎯</span>`
        }
        </div>
      `,
      className: 'custom-mission-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }

  readonly scores = signal<Record<string, number>>({});

  async rateUpdate(updatePublicId: string, points: number): Promise<void> {
    try {
      await firstValueFrom(this.missionUpdateService.scoreUpdate(updatePublicId, points));
      this.toastService.award(`¡Valoración enviada! Se otorgaron +${points} XP`);

      this.scores.update(prev => ({
        ...prev,
        [updatePublicId]: points
      }));

      const publicId = this.route.snapshot.paramMap.get('publicId') || '';
      await this.loadResponses(publicId);
    } catch (error) {
      console.error(error);
      this.toastService.error(error instanceof Error ? error.message : "No se pudo valorar el comentario");
    }
  }

  getPoints(updatePublicId: string): number {
    const found = this.responses().find(r => r.publicId === updatePublicId);
    return found?.pointValue?.points || this.scores()[updatePublicId] || 0;
  }

  async contactOwner(): Promise<void> {
    const ow = this.owner();
    if (!ow) return;

    try {
      const conversationId = await this.chatsService.getOrCreateConversation(ow.publicId);
      this.router.navigate(['/chats'], { queryParams: { conversation: conversationId } });
    } catch {
      this.toastService.error('No se pudo abrir el chat');
    }
  }

  openImageModal(url: string): void {
    this.activeImage.set(url);
  }

  closeImageModal(): void {
    this.activeImage.set(null);
  }

}
