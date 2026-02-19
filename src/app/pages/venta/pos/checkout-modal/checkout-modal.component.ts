import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PedidoService } from '../../../../services/venta/pedido.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-checkout-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-modal.component.html',
  styleUrl: './checkout-modal.component.css'
})
export class CheckoutModalComponent {

  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);

  // --- INPUTS / OUTPUTS ---
  @Input({ required: true }) pedidoId!: string;
  @Input({ required: true }) total!: number; // Total a pagar

  @Output() onCancelar = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<boolean>();

  // --- SIGNALS DE ESTADO ---
  metodoSeleccionado = signal<string>('EFECTIVO'); // 'EFECTIVO', 'TARJETA', 'YAPE', 'PLIN'
  montoRecibido = signal<number>(0);
  procesando = signal<boolean>(false);

  // --- COMPUTED ---
  vuelto = computed(() => {
    const recibido = this.montoRecibido();
    const total = this.total;
    if (this.metodoSeleccionado() !== 'EFECTIVO') return 0;
    return recibido > total ? recibido - total : 0;
  });

  falta = computed(() => {
    const recibido = this.montoRecibido();
    const total = this.total;
    if (this.metodoSeleccionado() !== 'EFECTIVO') return 0;
    return recibido < total ? total - recibido : 0;
  });

  // --- MÉTODOS ---

  seleccionarMetodo(metodo: string) {
    this.metodoSeleccionado.set(metodo);
    // Si es tarjeta o digital, asumimos pago exacto automáticamente
    if (metodo !== 'EFECTIVO') {
      this.montoRecibido.set(this.total);
    } else {
      this.montoRecibido.set(0); // Reiniciar si vuelve a efectivo
    }
  }

  setMontoExacto() {
    this.montoRecibido.set(this.total);
  }

  procesarPago() {
    // 1. Validaciones
    if (this.metodoSeleccionado() === 'EFECTIVO' && this.montoRecibido() < this.total) {
      Swal.fire('Monto insuficiente', `Faltan S/ ${this.falta().toFixed(2)}`, 'warning');
      return;
    }

    this.procesando.set(true);

    const sucursalId = this.getSucursal().sucursalId;

    // 2. Llamada al Servicio (Usando el método que definiste antes)
    this.pedidoService.registrarPago(this.pedidoId, this.metodoSeleccionado(), sucursalId || '').subscribe({
      next: () => {
        this.procesando.set(false);
        Swal.fire('¡Pago Exitoso!', 'La mesa ha sido liberada.', 'success');
        this.onPagoExitoso.emit(true); // Avisamos al padre para que cierre todo
      },
      error: (err) => {
        console.error(err);
        this.procesando.set(false);
        Swal.fire('Error', 'No se pudo procesar el pago.', 'error');
      }
    });
  }

  cancelar() {
    this.onCancelar.emit();
  }

  private getSucursal() {
    const token = this.authService.getToken();
    if (!token) return { sucursalId: null };
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { sucursalId: payload.sucursalId };
    } catch (e) { return { sucursalId: null }; }
  }
}
