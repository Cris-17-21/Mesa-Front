import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { SuperAdminDashboard } from '../../models/dashboard/superadmin-dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TableModule, ChartModule, HasPermissionDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  readonly isSuperAdmin = this.authService.isSuperAdmin;
  readonly today = new Date();

  // Regular Admin / User data
  totalUsers: number = 0;

  // SuperAdmin data
  readonly superAdminData = signal<SuperAdminDashboard | null>(null);
  readonly loading = signal(false);

  // Chart configs
  barChartData: any;
  barChartOptions: any;
  doughnutChartData: any;
  doughnutChartOptions: any;

  ngOnInit() {
    if (this.isSuperAdmin()) {
      this.loadSuperAdminDashboard();
    } else {
      // Regular user initialization
      if (this.authService.hasPermission('READ_USER')) {
        this.userService.getAllUsers().subscribe(users => {
          this.totalUsers = Array.isArray(users) ? users.length : 0;
        });
      }
    }
  }

  private loadSuperAdminDashboard() {
    this.loading.set(true);
    this.dashboardService.getSuperAdminData().subscribe({
      next: (data) => {
        this.superAdminData.set(data);
        this.initCharts(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando el dashboard del SuperAdmin', err);
        this.loading.set(false);
      }
    });
  }

  private initCharts(data: SuperAdminDashboard) {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#18181b';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#71717a';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e4e4e7';

    // 1. Bar Chart: Users and Branches per Company
    const companyLabels = data.empresasStats.map(e => e.razonSocial);
    const usersData = data.empresasStats.map(e => e.cantidadUsuarios);
    const branchesData = data.empresasStats.map(e => e.cantidadSucursales);

    this.barChartData = {
      labels: companyLabels,
      datasets: [
        {
          label: 'Usuarios Registrados',
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          data: usersData
        },
        {
          label: 'Sedes Activas',
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          data: branchesData
        }
      ]
    };

    this.barChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500
            }
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };

    // 2. Doughnut Chart: Company Status
    this.doughnutChartData = {
      labels: ['Activas', 'Inactivas'],
      datasets: [
        {
          data: [data.empresasActivas, data.empresasInactivas],
          backgroundColor: ['#10b981', '#ef4444'],
          hoverBackgroundColor: ['#34d399', '#f87171']
        }
      ]
    };

    this.doughnutChartOptions = {
      cutout: '60%',
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      }
    };
  }
}