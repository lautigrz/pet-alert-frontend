import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ReportesHttp } from '../infrastructure/reportes.http';
import { Reporte, ReporteFiltros } from '../domain/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly reportesHttp = inject(ReportesHttp);


  async getGenerales(filtros: ReporteFiltros = {}): Promise<Reporte[]> {
    try {
      return await this.reportesHttp.getFiltered(filtros);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  
  async getMisReportes(filtros: ReporteFiltros = {}): Promise<Reporte[]> {
    try {
      const { data } = await this.reportesHttp.getMisReportesPaginado();
      return this.aplicarFiltros(data, filtros);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  
  async updateToResolved(publicId: string): Promise<void> {
    try {
      await this.reportesHttp.updateStatus(publicId, 'RESOLVED');
    } catch (error) {
      throw this.mapError(error);
    }
  }

  
  private aplicarFiltros(reportes: Reporte[], filtros: ReporteFiltros): Reporte[] {
    return reportes.filter((r) => {
      if (filtros.reportType && r.type !== filtros.reportType) return false;
      if (filtros.animalType && this.animalDe(r) !== filtros.animalType) return false;
      if (filtros.createdFrom && r.createdAt < filtros.createdFrom) return false;
      if (filtros.createdTo && r.createdAt > `${filtros.createdTo}T23:59:59.999Z`) return false;
      return true;
    });
  }

  private animalDe(r: Reporte): string | undefined {
    const animal = (r.details as { animalType?: string }).animalType;
    return animal?.toUpperCase();
  }

  private mapError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return new Error('Ocurrió un error inesperado');
    }
    if (error.status === 0) {
      return new Error('No se pudo conectar con el servidor');
    }
    if (error.status === 400) {
      return new Error(error.error?.error ?? 'Filtros inválidos');
    }
    return new Error('No se pudieron cargar los reportes');
  }
}
