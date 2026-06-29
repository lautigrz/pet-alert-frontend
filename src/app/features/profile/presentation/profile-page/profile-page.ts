import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../application/profile.service';
import { UpdatedProfile } from '../../domain/profile.model';
import { ReportListService } from '../../../report/application/report-list.service';
import { Reporte } from '../../../report/domain/report-read.model';
import { HomeReportCardComponent } from '../../../home-map/components/home-report-card/home-report-card';

type ProfileTab = 'reports' | 'missions' | 'achievements';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, HomeReportCardComponent],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.css'],
})


export class ProfilePage implements OnInit  {
  private readonly profileService = inject(ProfileService);
  private readonly reportListService = inject(ReportListService);

  readonly rutaMiPerfil = '/profile/edit';
  readonly profile = signal<UpdatedProfile | null>(null);
  readonly loading = signal(true);
  readonly serverError = signal<string | null>(null);
  readonly activeTab = signal<ProfileTab>('reports');

  readonly reports = signal<Reporte[]>([]);
  readonly reportsLoading = signal(true);
  readonly reportsError = signal<string | null>(null);

  readonly defaultPhotoUrl = 'https://ui-avatars.com/api/?name=Perfil&background=e2e8f0&color=12355B&size=128';

  async ngOnInit(): Promise<void>{
    await Promise.all([this.loadProfile(), this.loadReports()]);
  }

  async loadProfile(): Promise<void>{
    this.loading.set(true);
    this.serverError.set(null);

    try{
      const profile = await this.profileService.getProfile();
      this.profile.set(profile);
    } catch(error){
      this.serverError.set(error instanceof Error ? error.message : 'No se pudo cargar el perfil');
    } finally {
      this.loading.set(false);
    }
  }

  async loadReports(): Promise<void>{
    this.reportsLoading.set(true);
    this.reportsError.set(null);

    try{
      const reports = await this.reportListService.getMisReportes();
      this.reports.set(reports);
    } catch(error){
      this.reportsError.set(error instanceof Error ? error.message : 'No se pudieron cargar los reportes');
    } finally {
      this.reportsLoading.set(false);
    }
  }

  profilePhotoUrl(): string{
    return this.profile()?.photoUrl || this.defaultPhotoUrl;
  }

  displayName(): string {
    const profile = this.profile();

    if(!profile) return '';
    const fullName = `${profile.name ?? ''} ${profile.lastname ?? ''}`.trim();

    return fullName || profile.username;
  }

  setTab(tab: ProfileTab): void{
    this.activeTab.set(tab);
  }

}
