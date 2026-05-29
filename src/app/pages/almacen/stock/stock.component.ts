import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InventarioService, InventarioDto } from '../../../services/inventario/inventario.service';
import { CategoriaService } from '../../../services/inventario/categoria.service';
import { AuthService } from '../../../core/auth/auth.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { MovimientoModalComponent } from '../components/movimiento-modal/movimiento-modal.component';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ToastModule, InputTextModule, DropdownModule, FormsModule, HasPermissionDirective, MovimientoModalComponent],
  providers: [MessageService],
  template: `
    <div class="card p-4">
        <p-toast></p-toast>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 0.5rem;">
            <!-- Fila superior: Titulo y Botones -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0;">Stock de Almacén</h2>
                <div style="display: flex; gap: 0.5rem;">
                    <button *appHasPermission="'EDIT_INVENTARIO'" pButton label="Entrada" icon="bi bi-box-arrow-in-right" class="p-button-success" (click)="abrirModal('ENTRADA')"></button>
                    <button *appHasPermission="'EDIT_INVENTARIO'" pButton label="Salida" icon="bi bi-box-arrow-right" class="p-button-danger" (click)="abrirModal('SALIDA')"></button>
                </div>
            </div>
            
            <!-- Fila inferior: Buscador y Filtro -->
            <div style="display: flex; gap: 1rem; width: 100%; max-width: 600px;">
                <span style="flex: 1; display: block; position: relative;">
                    <i class="bi bi-search" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #6c757d; z-index: 1;"></i>
                    <input pInputText type="text" [(ngModel)]="searchTerm" (input)="dt.filterGlobal(searchTerm, 'contains')" placeholder="Buscar producto..." style="width: 100%; padding-left: 2.5rem;">
                </span>
                <span style="flex: 1; display: block;">
                    <p-dropdown [options]="categorias" [(ngModel)]="selectedCategoria" (onChange)="dt.filter(selectedCategoria, 'nombreCategoria', 'equals')" placeholder="Categoría" [showClear]="true" [style]="{'width':'100%'}"></p-dropdown>
                </span>
            </div>
        </div>

        <p-table #dt [value]="productos" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="10" 
                 [globalFilterFields]="['nombreProducto', 'nombreProveedor']" sortMode="multiple">
            <ng-template pTemplate="header">
                <tr>
                    <th pSortableColumn="nombreProducto">Producto <p-sortIcon field="nombreProducto"></p-sortIcon></th>
                    <th pSortableColumn="nombreProveedor">Proveedor <p-sortIcon field="nombreProveedor"></p-sortIcon></th>
                    <th pSortableColumn="stockMinimo">Stock Mínimo <p-sortIcon field="stockMinimo"></p-sortIcon></th>
                    <th pSortableColumn="stockActual">Stock Actual <p-sortIcon field="stockActual"></p-sortIcon></th>
                    <th>Estado</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-producto>
                <tr [ngClass]="{'bg-red-50': producto.stockActual < producto.stockMinimo}">
                    <td><strong>{{ producto.nombreProducto }}</strong></td>
                    <td>{{ producto.nombreProveedor || 'N/A' }}</td>
                    <td>{{ producto.stockMinimo }}</td>
                    <td class="font-bold text-lg" [ngClass]="{'text-red-500': producto.stockActual < producto.stockMinimo}">
                        {{ producto.stockActual }}
                    </td>
                    <td>
                        <span *ngIf="producto.stockActual >= producto.stockMinimo" class="product-badge status-instock">OK</span>
                        <span *ngIf="producto.stockActual > 0 && producto.stockActual < producto.stockMinimo" class="product-badge status-lowstock">Bajo Stock</span>
                        <span *ngIf="producto.stockActual <= 0" class="product-badge status-outofstock">Agotado</span>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="5" class="text-center p-4">No se encontraron productos en inventario.</td></tr>
            </ng-template>
        </p-table>
    </div>

    <!-- Modal para movimientos manuales -->
    <app-movimiento-modal
      #movimientoModal
      (onSaved)="loadStock()"
      [productos]="productos"
    ></app-movimiento-modal>
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
    .status-lowstock { background: #FFEDD5; color: #C2410C; }
    .status-outofstock { background: #FFCDD2; color: #C63737; }
  `]
})
export class StockComponent implements OnInit {
  inventarioService: InventarioService = inject(InventarioService);
  categoriaService: CategoriaService = inject(CategoriaService);
  authService: AuthService = inject(AuthService);
  messageService: MessageService = inject(MessageService);

  @ViewChild('movimientoModal') movimientoModal!: MovimientoModalComponent;

  productos: InventarioDto[] = [];
  categorias: string[] = [];
  
  searchTerm: string = '';
  selectedCategoria: string | null = null;

  ngOnInit() {
    this.loadStock();
    this.loadCategorias();
  }

  loadStock() {
    const sucursalId = this.authService.getSucursalId();
    if (!sucursalId) return;

    this.inventarioService.listarProductosInventario(sucursalId).subscribe({
      next: (data: any) => {
        this.productos = data;
      },
      error: (err: any) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el stock.' });
      }
    });
  }

  loadCategorias() {
    this.categoriaService.getAll().subscribe({
        next: (data: any[]) => {
            this.categorias = data.map(c => c.nombreCategoria);
        },
        error: (err: any) => console.error('Error loading categories', err)
    });
  }

  abrirModal(tipo: 'ENTRADA' | 'SALIDA') {
    this.movimientoModal.abrir(tipo);
  }
}
