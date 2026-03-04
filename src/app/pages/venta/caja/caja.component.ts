import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';

// Directivas y Componentes
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { CajaControlModalComponent } from './caja-control-modal/caja-control-modal.component';
import { CajaMovimientoModalComponent } from './caja-movimiento-modal/caja-movimiento-modal.component';

// Servicios
import { CajaService } from '../../../services/venta/caja.service';
import { MovimientoCajaService } from '../../../services/venta/movimiento-caja.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    MenuModule,
    HasPermissionDirective,
    CajaControlModalComponent,
    CajaMovimientoModalComponent
  ],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.css'
})
export class CajaComponent implements OnInit {

  // ===============================
  // Inyección moderna
  // ===============================

  public cajaService = inject(CajaService);
  public movimientoService = inject(MovimientoCajaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // ===============================
  // Estado UI con Signals
  // ===============================

  showControlModal = signal(false);
  showMovementModal = signal(false);
  controlType = signal<'OPEN' | 'CLOSE'>('OPEN');

  currentSucursalId = signal<string | null>(null);
  currentUsuarioId = signal<string | null>(null);

  today = new Date();

  ngOnInit() {
    this.initCaja();
  }

  constructor() {
    effect(() => {
      if (this.cajaService.loading()) return;

      if (this.cajaService.isCajaAbierta()) {
        console.log('Caja abierta:', this.cajaService.cajaActiva());
        this.loadDashboardData(this.cajaService.cajaIdActual());
      }
    });
  }

  // ===============================
  // Inicialización reactiva
  // ===============================

  private async initCaja() {
    const sucursalId = this.authService.getSucursalId();
    const usuarioId = await this.authService.getUserId();

    this.currentSucursalId.set(sucursalId);
    this.currentUsuarioId.set(usuarioId);

    if (sucursalId && usuarioId) {
      this.cajaService.verificarEstadoCaja(sucursalId, usuarioId);
    }
  }

  private loadDashboardData(cajaId: string) {
    this.cajaService.obtenerArqueo(cajaId);
    this.movimientoService.listarMovimientos(cajaId);
  }

  // ===============================
  // Acciones UI
  // ===============================

  abrirCaja() {
    this.controlType.set('OPEN');
    this.showControlModal.set(true);
  }

  cerrarCaja() {
    this.controlType.set('CLOSE');
    this.showControlModal.set(true);
  }

  registrarMovimiento() {
    this.showMovementModal.set(true);
  }

  irAlPOS() {
    this.router.navigate(['/ventas/pos']);
  }

  // ===============================
  // Callback de Modales
  // ===============================

  onOperationSuccess() {
    const cajaActual = this.cajaService.cajaActiva();

    if (cajaActual) {
      this.loadDashboardData(cajaActual.id);
    } else {
      this.movimientoService.limpiarEstado();
    }

    this.showControlModal.set(false);
    this.showMovementModal.set(false);
  }
}