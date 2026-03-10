import { Component, inject, OnInit, signal, computed, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { Table, TableModule } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

import { PedidoService } from '../../../services/venta/pedido.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../services/user/user.service';
import { PedidoResumenDto } from '../../../models/venta/pedido.model';
import { PreCuentaModalComponent } from './pre-cuenta-modal/pre-cuenta-modal.component';

interface UserResponse {
  user: {
    id: string;
  };
}

@Component({
  selector: 'app-pre-cuenta',
  standalone: true,
  imports: [
    TableModule,
    PreCuentaModalComponent,
    CommonModule,
    TabViewModule
  ],
  templateUrl: './pre-cuenta.component.html',
  styleUrl: './pre-cuenta.component.css'
})
export class PreCuentaComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  displayModal = signal(false);
  sucursalId = signal<string | null>(null);
  usuarioId = signal<string | null>(null);

  modalMode = signal<'NUEVO' | 'EDITAR'>('NUEVO');
  selectedPedidoId = signal<string | null>(null);

  pedidosActivos = this.pedidoService.pedidosActivos;

  pedidosMesa = computed(() =>
    this.pedidosActivos().filter(p => !!p.codigoMesa)
  );

  pedidosDelivery = computed(() =>
    this.pedidosActivos().filter(p => !p.codigoMesa)
  );

  @ViewChildren('dt') tables!: QueryList<Table>;

  onSearch(value: string): void {
    this.tables?.forEach(table => {
      table.filterGlobal(value, 'contains');
    });
  }

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

  openCreate(): void {
    this.modalMode.set('NUEVO');
    this.selectedPedidoId.set(null);
    this.displayModal.set(true);
  }

  verDetalle(pedido: PedidoResumenDto): void {
    this.modalMode.set('EDITAR');
    this.selectedPedidoId.set(pedido.id);
    this.displayModal.set(true);
  }

  private async getAuthData(): Promise<{ sucursalId: string | null; usuarioId: string | null }> {
    const token = this.authService.getToken();
    if (!token) return { sucursalId: null, usuarioId: null };

    try {
      const userResponse = await firstValueFrom(this.userService.getUserMe()) as UserResponse;
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