import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { environment } from '../../core/environment/environment';
import {
  SalesSummaryDto,
  MenuRankingDto,
  CajaAuditDto,
  StockCriticalDto,
  WaiterPerformanceDto
} from '../../models/venta/reportes.model';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/reportes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService]
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getSalesSummary with correct parameters', () => {
    const dummySummary: SalesSummaryDto = {
      totalVentas: 100,
      promedioTicket: 50,
      totalEfectivo: 50,
      totalTarjeta: 50,
      totalYape: 0,
      totalPlin: 0,
      totalOtros: 0,
      ventasDiarias: []
    };

    service.getSalesSummary(['suc-1'], '2026-07-01', '2026-07-02').subscribe(data => {
      expect(data).toEqual(dummySummary);
    });

    const req = httpMock.expectOne(req => req.url === `${baseUrl}/sales`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.getAll('sucursalIds')).toEqual(['suc-1']);
    expect(req.request.params.get('fechaInicio')).toBe('2026-07-01');
    expect(req.request.params.get('fechaFin')).toBe('2026-07-02');
    req.flush(dummySummary);
  });

  it('should call getMenuRanking with correct parameters', () => {
    const dummyRanking: MenuRankingDto[] = [
      { nombrePlato: 'Plato 1', cantidad: 10, ingresos: 150 }
    ];

    service.getMenuRanking(['suc-1'], '2026-07-01', '2026-07-02').subscribe(data => {
      expect(data).toEqual(dummyRanking);
    });

    const req = httpMock.expectOne(req => req.url === `${baseUrl}/menu-ranking`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.getAll('sucursalIds')).toEqual(['suc-1']);
    req.flush(dummyRanking);
  });

  it('should call getCajaAudit with correct parameters', () => {
    const dummyAudit: CajaAuditDto[] = [];

    service.getCajaAudit(['suc-1'], '2026-07-01', '2026-07-02').subscribe(data => {
      expect(data).toEqual(dummyAudit);
    });

    const req = httpMock.expectOne(req => req.url === `${baseUrl}/caja-audit`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyAudit);
  });

  it('should call getStockCritical with correct parameters', () => {
    const dummyStock: StockCriticalDto = {
      valoracionTotalInventario: 500,
      productosBajoStock: []
    };

    service.getStockCritical(['suc-1']).subscribe(data => {
      expect(data).toEqual(dummyStock);
    });

    const req = httpMock.expectOne(req => req.url === `${baseUrl}/stock-critical`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.getAll('sucursalIds')).toEqual(['suc-1']);
    req.flush(dummyStock);
  });

  it('should call getWaiterPerformance with correct parameters', () => {
    const dummyPerformance: WaiterPerformanceDto[] = [];

    service.getWaiterPerformance(['suc-1'], '2026-07-01', '2026-07-02').subscribe(data => {
      expect(data).toEqual(dummyPerformance);
    });

    const req = httpMock.expectOne(req => req.url === `${baseUrl}/waiter-performance`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyPerformance);
  });

  it('should call exportPdf with correct parameters', () => {
    const blob = new Blob();

    service.exportPdf('sales', ['suc-1'], '2026-07-01', '2026-07-02').subscribe(data => {
      expect(data).toEqual(blob);
    });

    const req = httpMock.expectOne(req => req.url === `${baseUrl}/export/pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('reportType')).toBe('sales');
    req.flush(blob);
  });

  it('should call exportExcel with correct parameters', () => {
    const blob = new Blob();

    service.exportExcel('sales', ['suc-1'], '2026-07-01', '2026-07-02').subscribe(data => {
      expect(data).toEqual(blob);
    });

    const req = httpMock.expectOne(req => req.url === `${baseUrl}/export/excel`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('reportType')).toBe('sales');
    req.flush(blob);
  });
});
