import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsComponent } from './reports.component';
import { ReportService } from '../../services/venta/report.service';
import { SucursalService } from '../../services/maestro/sucursal.service';
import { AuthService } from '../../core/auth/auth.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;

  const mockSucursales = [
    { id: 'suc-1', nombre: 'Sede A', estado: true, direccion: '', telefono: '', apiSucursalId: '', empresa: {} as any },
    { id: 'suc-2', nombre: 'Sede B', estado: true, direccion: '', telefono: '', apiSucursalId: '', empresa: {} as any }
  ];

  const mockSalesSummary = {
    totalVentas: 100,
    promedioTicket: 50,
    totalEfectivo: 50,
    totalTarjeta: 50,
    totalYape: 0,
    totalPlin: 0,
    totalOtros: 0,
    ventasDiarias: [{ fecha: '2026-07-04', total: 100, cantidadPedidos: 2 }]
  };

  const mockReportService = {
    getSalesSummary: jasmine.createSpy('getSalesSummary').and.returnValue(of(mockSalesSummary)),
    getMenuRanking: jasmine.createSpy('getMenuRanking').and.returnValue(of([])),
    getCajaAudit: jasmine.createSpy('getCajaAudit').and.returnValue(of([])),
    getStockCritical: jasmine.createSpy('getStockCritical').and.returnValue(of({ valoracionTotalInventario: 0, productosBajoStock: [] })),
    getWaiterPerformance: jasmine.createSpy('getWaiterPerformance').and.returnValue(of([]))
  };

  const mockSucursalService = {
    getAllActiveSucursales: jasmine.createSpy('getAllActiveSucursales').and.returnValue(of(mockSucursales))
  };

  const mockAuthService = {
    isSuperAdmin: jasmine.createSpy('isSuperAdmin').and.returnValue(true),
    getSucursalId: jasmine.createSpy('getSucursalId').and.returnValue('suc-1')
  };

  beforeEach(async () => {
    mockReportService.getSalesSummary.calls.reset();
    mockReportService.getMenuRanking.calls.reset();
    mockReportService.getCajaAudit.calls.reset();
    mockReportService.getStockCritical.calls.reset();
    mockReportService.getWaiterPerformance.calls.reset();
    mockSucursalService.getAllActiveSucursales.calls.reset();
    mockAuthService.isSuperAdmin.calls.reset();
    mockAuthService.getSucursalId.calls.reset();

    await TestBed.configureTestingModule({
      imports: [
        ReportsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ReportService, useValue: mockReportService },
        { provide: SucursalService, useValue: mockSucursalService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
  });

  it('should create and load sucursales and all reports with default filter "mes" on init', () => {
    mockAuthService.isSuperAdmin.and.returnValue(true);
    
    fixture.detectChanges(); // triggers ngOnInit

    expect(component).toBeTruthy();
    expect(mockSucursalService.getAllActiveSucursales).toHaveBeenCalled();
    expect(component.sucursales()).toEqual(mockSucursales);
    // As SuperAdmin, all sucursales should be selected by default
    expect(component.selectedSucursalIds()).toEqual(['suc-1', 'suc-2']);
    
    // Default filter should be 'mes'
    expect(component.rangoOption()).toBe('mes');
    expect(component.fechaInicioInput()).not.toBe('');
    expect(component.fechaFinInput()).not.toBe('');

    // Should call reports load
    expect(mockReportService.getSalesSummary).toHaveBeenCalled();
  });

  it('should select only user sucursal if NOT superadmin', () => {
    mockAuthService.isSuperAdmin.and.returnValue(false);
    mockAuthService.getSucursalId.and.returnValue('suc-1');

    fixture.detectChanges();

    expect(component.selectedSucursalIds()).toEqual(['suc-1']);
  });

  it('should calculate dates and trigger load when rangoOption changes', () => {
    fixture.detectChanges();
    mockReportService.getSalesSummary.calls.reset();

    component.onRangoChange('hoy');
    expect(component.rangoOption()).toBe('hoy');
    
    // Check that fechaInicio and fechaFin are computed correctly for 'hoy'
    const todayStr = new Date().toISOString().substring(0, 10);
    expect(component.fechaInicioInput()).toBe(todayStr);
    expect(component.fechaFinInput()).toBe(todayStr);
  });
});
