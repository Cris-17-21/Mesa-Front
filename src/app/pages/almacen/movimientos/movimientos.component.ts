import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InventarioService, MovimientoInventarioDto, InventarioDto } from '../../../services/inventario/inventario.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, TableModule, DropdownModule, FormsModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card p-4">
        <p-toast></p-toast>
        <div class="flex flex-column gap-3 mb-4">
            <h2 class="m-0">Kárdex de Movimientos</h2>
            <p class="text-500 m-0">Selecciona un producto para ver su historial de movimientos.</p>
            
            <div class="w-full md:w-30rem">
                <p-dropdown 
                    [options]="productos" 
                    [(ngModel)]="productoSeleccionado" 
                    optionLabel="nombreProducto" 
                    [filter]="true" 
                    filterBy="nombreProducto" 
                    placeholder="Escribe el nombre del producto..." 
                    [showClear]="true"
                    (onChange)="onProductoChange()"
                    class="w-full"
                    styleClass="w-full">
                </p-dropdown>
            </div>
        </div>

        <p-table [value]="movimientos" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="15" *ngIf="productoSeleccionado">
            <ng-template pTemplate="header">
                <tr>
                    <th pSortableColumn="fechaMovimiento">Fecha <p-sortIcon field="fechaMovimiento"></p-sortIcon></th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Referencia</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-mov>
                <tr>
                    <td>{{ mov.fechaMovimiento | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                        <span class="product-badge" [ngClass]="mov.tipoMovimiento === 'ENTRADA' ? 'status-instock' : 'status-outofstock'">
                            {{ mov.tipoMovimiento }}
                        </span>
                    </td>
                    <td class="font-bold text-center" [ngClass]="mov.tipoMovimiento === 'ENTRADA' ? 'text-green-600' : 'text-red-600'">
                        {{ mov.tipoMovimiento === 'ENTRADA' ? '+' : '-' }}{{ mov.cantidad }}
                    </td>
                    <td>{{ mov.motivo }}</td>
                    <td>{{ mov.comprobante || '-' }}</td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="5" class="text-center p-4">Este producto no registra movimientos aún.</td></tr>
            </ng-template>
        </p-table>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .product-badge {
        border-radius: 2px;
        padding: .25em .5rem;
        text-transform: uppercase;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: .3px;
    }
    .status-instock { background: #C8E6C9; color: #256029; }
    .status-outofstock { background: #FFCDD2; color: #C63737; }
  `]
})
export class MovimientosComponent implements OnInit {
  inventarioService: InventarioService = inject(InventarioService);
  authService: AuthService = inject(AuthService);
  messageService: MessageService = inject(MessageService);

  productos: InventarioDto[] = [];
  movimientos: MovimientoInventarioDto[] = [];
  productoSeleccionado: InventarioDto | null = null;

  ngOnInit() {
    this.loadProductos();
  }

  loadProductos() {
    const sucursalId = this.authService.getSucursalId();
    if (!sucursalId) return;

    this.inventarioService.listarProductosInventario(sucursalId).subscribe({
      next: (data: any) => {
        this.productos = data;
      },
      error: (err: any) => console.error('Error loading productos', err)
    });
  }

  onProductoChange() {
    if (!this.productoSeleccionado) {
        this.movimientos = [];
        return;
    }

    const sucursalId = this.authService.getSucursalId();
    this.inventarioService.obtenerHistorialMovimientosPorProducto(this.productoSeleccionado.idProducto, sucursalId).subscribe({
      next: (data: any) => {
        this.movimientos = data;
      },
      error: (err: any) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial.' });
      }
    });
  }
}
