import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';

// Directivas y Componentes Propios
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { CajaControlModalComponent } from './caja-control-modal/caja-control-modal.component';
import { CajaMovimientoModalComponent } from './caja-movimiento-modal/caja-movimiento-modal.component';

// Servicios
import { CajaService } from '../../../services/venta/caja.service';
import { MovimientoCajaService } from '../../../services/venta/movimiento-caja.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../services/user/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    MenuModule,
    HasPermissionDirective,
    // Componentes Modales
    CajaControlModalComponent,
    CajaMovimientoModalComponent
  ],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.css'
})
export class CajaComponent implements OnInit {

  // --- Inyecciones ---
  public cajaService = inject(CajaService); // Public para usar signals en HTML
  public movimientoService = inject(MovimientoCajaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);

  // --- Estado de Modales ---
  showControlModal = false; // Para el modal de Abrir/Cerrar
  showMovementModal = false; // Para el modal de Movimientos
  controlType: 'OPEN' | 'CLOSE' = 'OPEN'; // Variable que controla si es Apertura o Cierre
  currentSucursalId: string | null = null;
  currentUsuarioId: string | null = null;

  // --- Helpers ---
  today = new Date();

  constructor() {
    // EFFECT: Reacciona automáticamente cuando cambia la caja activa (Signal)
    effect(() => {
      const caja = this.cajaService.cajaActiva();

      console.log('Detectando cambio en caja:', caja); // Log para depurar

      // CORRECCIÓN AQUÍ:
      // El backend manda 'ABIERTA', tu código esperaba 'ABIERTO'.
      // Usamos .includes o validamos ambas opciones por seguridad.
      if (caja && (caja.estado === 'ABIERTA' || caja.estado === 'ABIERTO')) {

        console.log('✅ Estado válido detectado, cargando dashboard...');
        this.loadDashboardData(caja.id);

      } else {
        // Si no hay caja o se cerró
        this.movimientoService.limpiarEstado();
      }
    });
  }

  ngOnInit(): void {
    this.checkEstadoInicial();
  }

  // --- Lógica de Inicialización ---

  async checkEstadoInicial() {
    const { sucursalId, usuarioId } = await this.getAuthData();
    // GUARDAMOS LOS DATOS EN LAS VARIABLES PÚBLICAS
    this.currentSucursalId = sucursalId;
    this.currentUsuarioId = usuarioId;

    if (sucursalId && usuarioId) {
      // Esto actualizará el Signal 'cajaActiva' en el servicio, disparando el effect
      this.cajaService.verificarEstadoCaja(sucursalId, usuarioId).subscribe();
    }
  }

  loadDashboardData(cajaId: string) {
    // 1. Traemos el arqueo financiero (KPIs)
    this.cajaService.obtenerArqueo(cajaId).subscribe();
    // 2. Traemos la lista de movimientos para la tabla
    this.movimientoService.listarMovimientos(cajaId).subscribe();
  }

  // --- Acciones de Botones (HTML) ---

  abrirCaja() {
    this.controlType = 'OPEN';
    this.showControlModal = true;
  }

  cerrarCaja() {
    this.controlType = 'CLOSE';
    this.showControlModal = true;
  }

  registrarMovimiento() {
    this.showMovementModal = true;
  }

  irAlPOS() {
    this.router.navigate(['/ventas/pos']);
  }

  // --- Callback de Modales ---

  /**
   * Se ejecuta cuando un modal (Apertura, Cierre o Movimiento) guarda exitosamente
   */
  onOperationSuccess() {
    const cajaActual = this.cajaService.cajaActiva();

    if (cajaActual) {
      // Si la caja sigue activa (ej. registré un gasto), recargo los números
      this.loadDashboardData(cajaActual.id);
    } else {
      // Si la caja se cerró (cajaActiva es null), limpiamos todo
      this.movimientoService.limpiarEstado();
    }
  }

  // --- Helpers Privados ---

  // 1. Agrega la palabra clave 'async'
  private async getAuthData() {
    const token = this.authService.getToken();

    // Si no hay token, retornamos nulls inmediatamente
    if (!token) return { sucursalId: null, usuarioId: null };

    try {
      // 2. Esperamos a que el Observable getUserMe() traiga los datos
      const userResponse = await firstValueFrom(this.userService.getUserMe());

      // 3. Decodificación del token (para la sucursal)
      const payload = JSON.parse(atob(token.split('.')[1]));

      console.log('Usuario obtenido:', userResponse);
      console.log(userResponse.user.id)

      return {
        sucursalId: payload.sucursalId, // Viene del Token
        usuarioId: userResponse.user.id // Viene del API (getUserMe)
      };

    } catch (e) {
      console.error('Error obteniendo datos de auth', e);
      return { sucursalId: null, usuarioId: null };
    }
  }
}