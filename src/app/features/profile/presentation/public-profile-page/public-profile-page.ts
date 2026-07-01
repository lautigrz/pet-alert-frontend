import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from '../../application/profile.service';
import { PublicProfile } from '../../domain/public-profile';
import { ReportListService } from '../../../report/application/report-list.service';
import { Reporte } from '../../../report/domain/report-read.model';
import { HomeReportCardComponent } from '../../../home-map/components/home-report-card/home-report-card';
import { AuthService } from '../../../auth/application/auth.service';
import { ReportModalComponent } from '../../../../shared/component/report-modal/report-modal';

type ProfileTab = 'reports' | 'missions' | 'achievements';

@Component({
  selector: 'app-public-profile-page',
  standalone: true,
  imports: [HomeReportCardComponent, ReportModalComponent],
  templateUrl: './public-profile-page.html',
  styleUrls: ['./public-profile-page.css'],
})
export class PublicProfilePage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly reportListService = inject(ReportListService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly profile = signal<PublicProfile | null>(null);
  readonly loading = signal(true);
  readonly serverError = signal<string | null>(null);
  readonly activeTab = signal<ProfileTab>('reports');

  readonly reports = signal<Reporte[]>([]);
  readonly reportsLoading = signal(true);
  readonly reportsError = signal<string | null>(null);

  readonly mostrandoModalDenuncia = signal(false);
  readonly menuOpcionesAbierto = signal(false);

  readonly esPropio = computed(() => {
    const p = this.profile();
    const currentUserId = this.authService.getCurrentUserId();
    return !!p && !!currentUserId && p.id === currentUserId;
  });

  readonly defaultPhotoUrl = 'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';

  async ngOnInit(): Promise<void> {
    const publicId = this.route.snapshot.paramMap.get('publicId');

    if (!publicId) {
      this.serverError.set('Usuario no encontrado');
      this.loading.set(false);
      this.reportsLoading.set(false);
      return;
    }

    await Promise.all([this.loadProfile(publicId), this.loadReports(publicId)]);
  }

  async loadProfile(publicId: string): Promise<void> {
    this.loading.set(true);
    this.serverError.set(null);

    try {
      const profile = await this.profileService.getPublicProfile(publicId);
      this.profile.set(profile);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'No se pudo cargar el perfil');
    } finally {
      this.loading.set(false);
    }
  }

  async loadReports(publicId: string): Promise<void> {
    this.reportsLoading.set(true);
    this.reportsError.set(null);

    try {
      const reports = await this.reportListService.getReportesDeUsuario(publicId);
      this.reports.set(reports);
    } catch (error) {
      this.reportsError.set(error instanceof Error ? error.message : 'No se pudieron cargar los reportes');
    } finally {
      this.reportsLoading.set(false);
    }
  }

  profilePhotoUrl(): string {
    return this.profile()?.photoUrl || this.defaultPhotoUrl;
  }

  displayName(): string {
    const profile = this.profile();

    if (!profile) return '';
    const fullName = `${profile.name ?? ''} ${profile.lastname ?? ''}`.trim();

    return fullName || profile.username;
  }

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  toggleMenuOpciones(event: Event): void {
    event.stopPropagation();
    this.menuOpcionesAbierto.update((abierto) => !abierto);
  }

  @HostListener('document:click')
  cerrarMenuOpciones(): void {
    this.menuOpcionesAbierto.set(false);
  }

  denunciarDesdeMenu(): void {
    this.cerrarMenuOpciones();
    this.abrirModalDenuncia();
  }

  abrirModalDenuncia(): void {
    this.mostrandoModalDenuncia.set(true);
  }

  cerrarModalDenuncia(): void {
    this.mostrandoModalDenuncia.set(false);
  }
}
