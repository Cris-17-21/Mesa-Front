import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

// PrimeNG
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';

// Services
import { ReportService } from '../../services/venta/report.service';
import { SucursalService } from '../../services/maestro/sucursal.service';
import { AuthService } from '../../core/auth/auth.service';

// Models
import { Sucursal } from '../../models/maestro/sucursal.model';
import {
  SalesSummaryDto,
  MenuRankingDto,
  CajaAuditDto,
  StockCriticalDto,
  WaiterPerformanceDto
} from '../../models/venta/reportes.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectModule,
    TableModule,
    ChartModule,
    SelectModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly sucursalService = inject(SucursalService);
  public readonly authService = inject(AuthService);

  // States
  readonly sucursales = signal<Sucursal[]>([]);
  readonly selectedSucursalIds = signal<string[]>([]);
  readonly rangoOption = signal<string>('mes');
  readonly fechaInicioInput = signal<string>('');
  readonly fechaFinInput = signal<string>('');
  readonly loading = signal<boolean>(false);

  // Report Data
  readonly salesSummary = signal<SalesSummaryDto | null>(null);
  readonly menuRanking = signal<MenuRankingDto[]>([]);
  readonly cajaAudits = signal<CajaAuditDto[]>([]);
  readonly stockCritical = signal<StockCriticalDto | null>(null);
  readonly waiterPerformances = signal<WaiterPerformanceDto[]>([]);

  // Date Selection Options
  readonly dateRangeOptions = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Ayer', value: 'ayer' },
    { label: 'Últimos 7 Días', value: '7dias' },
    { label: 'Mes Actual', value: 'mes' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  // Chart Configurations
  salesTrendChartData: any = null;
  salesTrendChartOptions: any = null;
  paymentBreakdownChartData: any = null;
  paymentBreakdownChartOptions: any = null;
  menuRankingChartData: any = null;
  menuRankingChartOptions: any = null;
  waiterPerformanceChartData: any = null;
  waiterPerformanceChartOptions: any = null;

  ngOnInit(): void {
    this.calculateDates(this.rangoOption());
    this.loadSucursales();
  }

  loadSucursales(): void {
    this.loading.set(true);
    this.sucursalService.getAllActiveSucursales().subscribe({
      next: (list) => {
        this.sucursales.set(list);
        if (!this.authService.isSuperAdmin()) {
          // Si no es superadmin, pre-seleccionar solo su sucursal
          const userSuc = this.authService.getSucursalId();
          if (userSuc) {
            this.selectedSucursalIds.set([userSuc]);
          } else {
            this.selectedSucursalIds.set(list.map(s => s.id));
          }
        } else {
          // Superadmin selecciona todas por defecto
          this.selectedSucursalIds.set(list.map(s => s.id));
        }
        this.loadAllReports();
      },
      error: (err) => {
        console.error('Error cargando sucursales:', err);
        this.loading.set(false);
      }
    });
  }

  onRangoChange(option: string): void {
    this.rangoOption.set(option);
    this.calculateDates(option);
  }

  calculateDates(option: string): void {
    const hoy = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let start = '';
    let end = formatDate(hoy);

    switch (option) {
      case 'hoy':
        start = formatDate(hoy);
        break;
      case 'ayer': {
        const ayer = new Date();
        ayer.setDate(hoy.getDate() - 1);
        start = formatDate(ayer);
        end = formatDate(ayer);
        break;
      }
      case '7dias': {
        const sieteDiasAgo = new Date();
        sieteDiasAgo.setDate(hoy.getDate() - 7);
        start = formatDate(sieteDiasAgo);
        break;
      }
      case 'mes': {
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        start = formatDate(primerDia);
        break;
      }
      case 'personalizado':
        // Dejar que el usuario edite
        return;
    }

    this.fechaInicioInput.set(start);
    this.fechaFinInput.set(end);
  }

  loadAllReports(): void {
    this.loading.set(true);
    const branchIds = this.selectedSucursalIds();
    const start = this.fechaInicioInput();
    const end = this.fechaFinInput();

    forkJoin({
      sales: this.reportService.getSalesSummary(branchIds, start, end),
      menu: this.reportService.getMenuRanking(branchIds, start, end),
      caja: this.reportService.getCajaAudit(branchIds, start, end),
      stock: this.reportService.getStockCritical(branchIds),
      waiter: this.reportService.getWaiterPerformance(branchIds, start, end)
    })
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.salesSummary.set(res.sales);
          this.menuRanking.set(res.menu);
          this.cajaAudits.set(res.caja);
          this.stockCritical.set(res.stock);
          this.waiterPerformances.set(res.waiter);
          this.setupCharts();
        },
        error: (err) => {
          console.error('Error cargando reportes:', err);
          Swal.fire({
            title: 'Error de Carga',
            text: 'Ocurrió un error al obtener la información agregada.',
            icon: 'error',
            confirmButtonColor: '#18181b'
          });
        }
      });
  }

  setupCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#18181b';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#71717a';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e4e4e7';

    // 1. Ventas Diarias (Trend Line Chart)
    const salesData = this.salesSummary();
    if (salesData && salesData.ventasDiarias && salesData.ventasDiarias.length > 0) {
      const labels = salesData.ventasDiarias.map(v => {
        if (!v.fecha) return '';
        const parts = v.fecha.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : v.fecha;
      });
      const totals = salesData.ventasDiarias.map(v => v.total);

      this.salesTrendChartData = {
        labels: labels,
        datasets: [
          {
            label: 'Ventas Diarias (S/.)',
            data: totals,
            fill: true,
            borderColor: '#18181b',
            backgroundColor: 'rgba(24, 24, 27, 0.04)',
            tension: 0.35,
            borderWidth: 2.5,
            pointBackgroundColor: '#18181b',
            pointHoverBackgroundColor: '#18181b',
            pointRadius: 2,
            pointHoverRadius: 4
          }
        ]
      };

      this.salesTrendChartOptions = {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary,
              font: { size: 10, weight: 500 }
            },
            grid: {
              color: 'transparent',
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: textColorSecondary,
              font: { size: 10 }
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          }
        }
      };

      // 2. Métodos de Pago (Doughnut Chart)
      this.paymentBreakdownChartData = {
        labels: ['Efectivo', 'Tarjeta', 'Yape', 'Plin', 'Otros'],
        datasets: [
          {
            data: [
              salesData.totalEfectivo || 0,
              salesData.totalTarjeta || 0,
              salesData.totalYape || 0,
              salesData.totalPlin || 0,
              salesData.totalOtros || 0
            ],
            backgroundColor: [
              '#10b981', // Efectivo -> Verde
              '#3b82f6', // Tarjeta -> Azul
              '#8b5cf6', // Yape -> Violeta
              '#ec4899', // Plin -> Rosado
              '#71717a'  // Otros -> Gris
            ],
            borderWidth: 1.5,
            borderColor: '#ffffff'
          }
        ]
      };

      this.paymentBreakdownChartOptions = {
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: textColor,
              boxWidth: 12,
              font: { size: 11, weight: 500 }
            }
          }
        }
      };
    } else {
      this.salesTrendChartData = null;
      this.paymentBreakdownChartData = null;
    }

    // 3. Platos Más Vendidos (Menu Ranking - Horizontal Bar Chart)
    const menuItems = this.menuRanking();
    if (menuItems && menuItems.length > 0) {
      const topItems = menuItems.slice(0, 10);
      this.menuRankingChartData = {
        labels: topItems.map(item => item.nombrePlato),
        datasets: [
          {
            label: 'Cantidad Vendida',
            data: topItems.map(item => item.cantidad),
            backgroundColor: '#18181b', // Noir
            borderRadius: 5,
            barThickness: 16
          }
        ]
      };

      this.menuRankingChartOptions = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary,
              font: { size: 10 }
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: textColor,
              font: { size: 11, weight: 500 }
            },
            grid: {
              color: 'transparent',
              drawBorder: false
            }
          }
        }
      };
    } else {
      this.menuRankingChartData = null;
    }

    // 4. Rendimiento de Mozos (Waiter Performance - Vertical Bar Chart)
    const waiters = this.waiterPerformances();
    if (waiters && waiters.length > 0) {
      this.waiterPerformanceChartData = {
        labels: waiters.map(w => w.waiterNombre),
        datasets: [
          {
            label: 'Pedidos',
            data: waiters.map(w => w.cantidadPedidos),
            backgroundColor: '#3b82f6',
            borderRadius: 5,
            barThickness: 24
          }
        ]
      };

      this.waiterPerformanceChartOptions = {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
              font: { size: 11, weight: 500 }
            },
            grid: {
              color: 'transparent',
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: textColorSecondary,
              font: { size: 10 }
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          }
        }
      };
    } else {
      this.waiterPerformanceChartData = null;
    }
  }

  exportReport(format: 'pdf' | 'excel', reportType: string): void {
    const branchIds = this.selectedSucursalIds();
    const start = this.fechaInicioInput();
    const end = this.fechaFinInput();

    Swal.fire({
      title: 'Generando archivo',
      text: 'Por favor espere mientras preparamos el documento...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const request$ = format === 'pdf'
      ? this.reportService.exportPdf(reportType, branchIds, start, end)
      : this.reportService.exportExcel(reportType, branchIds, start, end);

    request$
      .pipe(
        finalize(() => Swal.close())
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const ext = format === 'pdf' ? 'pdf' : 'xlsx';
          link.download = `reporte_${reportType.toLowerCase()}_${new Date().getTime()}.${ext}`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Error al exportar:', err);
          Swal.fire({
            title: 'Error de Exportación',
            text: `No se pudo descargar el archivo en formato ${format.toUpperCase()}.`,
            icon: 'error',
            confirmButtonColor: '#18181b'
          });
        }
      });
  }
}
