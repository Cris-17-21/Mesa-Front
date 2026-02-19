import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { PedidoResumenDto } from '../../../models/venta/pedido.model';
import { PedidoService } from '../../../services/venta/pedido.service';
import { AuthService } from '../../../core/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../../services/user/user.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PreCuentaModalComponent } from './pre-cuenta-modal/pre-cuenta-modal.component';

@Component({
  selector: 'app-pre-cuenta',
  standalone: true,
  imports: [TableModule, ButtonModule, PreCuentaModalComponent, CommonModule, IconFieldModule, InputIconModule],
  templateUrl: './pre-cuenta.component.html',
  styleUrl: './pre-cuenta.component.css'
})
export class PreCuentaComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  // Signals para estado
  displayModal = signal(false);
  sucursalId = signal<string | null>(null);
  usuarioId = signal<string | null>(null);

  modalMode = signal<'NUEVO' | 'EDITAR'>('NUEVO');
  selectedPedidoId = signal<string | null>(null);

  // Lista de pedidos activos (del servicio)
  pedidosActivos = this.pedidoService.pedidosActivos;

  async ngOnInit(): Promise<void> {
    const auth = await this.getAuthData();

    if (auth.sucursalId && auth.usuarioId) {
      this.sucursalId.set(auth.sucursalId);
      this.usuarioId.set(auth.usuarioId);
      this.loadDeliveries();
    }
  }

  loadDeliveries(): void {
    const id = this.sucursalId();
    if (id) {
      this.pedidoService.listarActivos(id).subscribe();
    }
  }

  openCreate() {
    this.modalMode.set('NUEVO');
    this.selectedPedidoId.set(null);
    this.displayModal.set(true);
  }

  verDetalle(pedido: PedidoResumenDto) {
    this.modalMode.set('EDITAR');
    this.selectedPedidoId.set(pedido.id);
    this.displayModal.set(true);
  }

  private async getAuthData() {
    const token = this.authService.getToken();
    if (!token) return { sucursalId: null, usuarioId: null };

    try {
      const userResponse = await firstValueFrom(this.userService.getUserMe());
      const payload = JSON.parse(atob(token.split('.')[1]));

      return {
        sucursalId: payload.sucursalId,
        usuarioId: userResponse.user.id
      };
    } catch (e) {
      console.error('Error obteniendo datos de auth', e);
      return { sucursalId: null, usuarioId: null };
    }
  }
}