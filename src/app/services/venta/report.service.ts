import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../core/environment/environment';
import {
  SalesSummaryDto,
  MenuRankingDto,
  CajaAuditDto,
  StockCriticalDto,
  WaiterPerformanceDto
} from '../../models/venta/reportes.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  private buildParams(sucursalIds?: string[], fechaInicio?: string, fechaFin?: string): HttpParams {
    let params = new HttpParams();
    if (sucursalIds && sucursalIds.length > 0) {
      sucursalIds.forEach(id => {
        params = params.append('sucursalIds', id);
      });
    }
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return params;
  }

  getSalesSummary(sucursalIds?: string[], fechaInicio?: string, fechaFin?: string): Observable<SalesSummaryDto> {
    const params = this.buildParams(sucursalIds, fechaInicio, fechaFin);
    return this.http.get<SalesSummaryDto>(`${this.apiUrl}/sales`, { params });
  }

  getMenuRanking(sucursalIds?: string[], fechaInicio?: string, fechaFin?: string): Observable<MenuRankingDto[]> {
    const params = this.buildParams(sucursalIds, fechaInicio, fechaFin);
    return this.http.get<MenuRankingDto[]>(`${this.apiUrl}/menu-ranking`, { params });
  }

  getCajaAudit(sucursalIds?: string[], fechaInicio?: string, fechaFin?: string): Observable<CajaAuditDto[]> {
    const params = this.buildParams(sucursalIds, fechaInicio, fechaFin);
    return this.http.get<CajaAuditDto[]>(`${this.apiUrl}/caja-audit`, { params });
  }

  getStockCritical(sucursalIds?: string[]): Observable<StockCriticalDto> {
    let params = new HttpParams();
    if (sucursalIds && sucursalIds.length > 0) {
      sucursalIds.forEach(id => {
        params = params.append('sucursalIds', id);
      });
    }
    return this.http.get<StockCriticalDto>(`${this.apiUrl}/stock-critical`, { params });
  }

  getWaiterPerformance(sucursalIds?: string[], fechaInicio?: string, fechaFin?: string): Observable<WaiterPerformanceDto[]> {
    const params = this.buildParams(sucursalIds, fechaInicio, fechaFin);
    return this.http.get<WaiterPerformanceDto[]>(`${this.apiUrl}/waiter-performance`, { params });
  }

  exportPdf(reportType: string, sucursalIds?: string[], fechaInicio?: string, fechaFin?: string): Observable<Blob> {
    let params = this.buildParams(sucursalIds, fechaInicio, fechaFin);
    params = params.set('reportType', reportType);
    return this.http.get(`${this.apiUrl}/export/pdf`, { params, responseType: 'blob' });
  }

  exportExcel(reportType: string, sucursalIds?: string[], fechaInicio?: string, fechaFin?: string): Observable<Blob> {
    let params = this.buildParams(sucursalIds, fechaInicio, fechaFin);
    params = params.set('reportType', reportType);
    return this.http.get(`${this.apiUrl}/export/excel`, { params, responseType: 'blob' });
  }
}
