import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Reporte, ReporteFiltros, ReportesPaginados } from '../domain/report-read.model';

@Injectable({ providedIn: 'root' })
export class ReportListHttp {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getFiltered(filtros: ReporteFiltros = {}): Promise<Reporte[]> {
    let params = new HttpParams();

    if (filtros.reportType) params = params.set('reportType', filtros.reportType);
    if (filtros.animalType) params = params.set('animalType', filtros.animalType);
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.createdFrom) params = params.set('createdFrom', filtros.createdFrom);
    if (filtros.createdTo) params = params.set('createdTo', filtros.createdTo);
    if (filtros.userPublicId) params = params.set('userPublicId', filtros.userPublicId);
    if (filtros.lat != null) params = params.set('lat', String(filtros.lat));
    if (filtros.lng != null) params = params.set('lng', String(filtros.lng));
    if (filtros.radiusKm != null) params = params.set('radiusKm', String(filtros.radiusKm));
    if (filtros.sort) params = params.set('sort', filtros.sort);
    if (filtros.q) params = params.set('q', filtros.q);

    return firstValueFrom(
      this.http.get<Reporte[]>(`${this.baseUrl}/reports/filter`, { params }),
    );
  }


  getMisReportesPaginado(filtros: ReporteFiltros = {}, page = 1, limit = 50): Promise<ReportesPaginados> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (filtros.reportType) params = params.set('reportType', filtros.reportType);
    if (filtros.animalType) params = params.set('animalType', filtros.animalType);
    if (filtros.lat != null) params = params.set('lat', String(filtros.lat));
    if (filtros.lng != null) params = params.set('lng', String(filtros.lng));
    if (filtros.radiusKm != null) params = params.set('radiusKm', String(filtros.radiusKm));
    if (filtros.createdFrom) params = params.set('createdFrom', filtros.createdFrom);
    if (filtros.createdTo) params = params.set('createdTo', filtros.createdTo);
    if (filtros.q) params = params.set('q', filtros.q);

    return firstValueFrom(
      this.http.get<ReportesPaginados>(`${this.baseUrl}/reports`, { params }),
    );
  }


  updateStatus(publicId: string, status: 'RESOLVED'): Promise<void> {
    return firstValueFrom(
      this.http.patch<void>(
        `${this.baseUrl}/reports/status/${publicId}`,
        { status }
      ),
    );
  }
}
