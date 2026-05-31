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
        
        <div class="stock-header-container">
            <div class="stock-title-section">
                <h2 class="stock-title">Stock de Almacén</h2>
                <p class="stock-subtitle">Monitorea y gestiona el inventario de tus productos</p>
            </div>
            
            <div class="stock-actions-section">
                <!-- Buscador Premium -->
                <div class="filter-search-container">
                    <i class="bi bi-search filter-search-icon"></i>
                    <input type="text" [(ngModel)]="searchTerm" (input)="dt.filterGlobal(searchTerm, 'contains')" placeholder="Buscar producto..." class="filter-search-input">
                    <button *ngIf="searchTerm" type="button" class="btn-clear-search" (click)="searchTerm = ''; dt.filterGlobal('', 'contains')">
                        <i class="bi bi-x-circle-fill"></i>
                    </button>
                </div>
                
                <!-- Dropdown de Categoría -->
                <p-dropdown [options]="categorias" [(ngModel)]="selectedCategoria" (onChange)="dt.filter(selectedCategoria, 'nombreCategoria', 'equals')" placeholder="Categoría" [showClear]="true" class="category-dropdown-wrapper" styleClass="w-full custom-dropdown"></p-dropdown>
                
                <!-- Botones de Acción -->
                <div class="action-buttons-group">
                    <button *appHasPermission="'EDIT_INVENTARIO'" pButton label="Entrada" icon="bi bi-box-arrow-in-right" class="p-button-success btn-action-in" (click)="abrirModal('ENTRADA')"></button>
                    <button *appHasPermission="'EDIT_INVENTARIO'" pButton label="Salida" icon="bi bi-box-arrow-right" class="p-button-danger btn-action-out" (click)="abrirModal('SALIDA')"></button>
                </div>
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
    
    /* Layout Header & Actions */
    .stock-header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        gap: 1rem;
    }
    
    .stock-title-section {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }
    
    .stock-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #18181b;
    }
    
    .stock-subtitle {
        margin: 0;
        font-size: 0.85rem;
        color: #71717a;
    }
    
    .stock-actions-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .category-dropdown-wrapper {
        width: 180px;
    }

    .action-buttons-group {
        display: flex;
        gap: 0.5rem;
    }

    .product-badge {
        border-radius: 4px;
        padding: .25em .6rem;
        text-transform: uppercase;
        font-weight: 700;
        font-size: 11px;
        letter-spacing: .5px;
        display: inline-block;
    }
    .status-instock { background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; }
    .status-lowstock { background: #FFF3E0; color: #EF6C00; border: 1px solid #FFE0B2; }
    .status-outofstock { background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; }

    /* Custom Premium Search Box */
    .filter-search-container {
        position: relative;
        display: flex;
        align-items: center;
        border: 1px solid #cbd5e1;
        border-radius: 20px;
        background-color: #ffffff;
        padding: 0 0.85rem;
        transition: all 0.25s ease;
        height: 38px;
        width: 250px;
    }
    .filter-search-container:hover {
        border-color: #94a3b8;
    }
    .filter-search-container:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    .filter-search-icon {
        color: #64748b;
        margin-right: 0.5rem;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
    }
    .filter-search-input {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        background: transparent !important;
        width: 100%;
        color: #1e293b;
        font-size: 0.9rem;
        padding: 0 !important;
    }
    .btn-clear-search {
        background: none;
        border: none;
        padding: 0;
        margin-left: 0.4rem;
        cursor: pointer;
        color: #94a3b8;
        display: flex;
        align-items: center;
        transition: color 0.15s ease;
    }
    .btn-clear-search:hover {
        color: #64748b;
    }

    /* PrimeNG Dropdown / Select Styling Override */
    :host ::ng-deep {
        .custom-dropdown {
            --p-select-border-radius: 20px !important;
            --p-dropdown-border-radius: 20px !important;
            border-radius: 20px !important;
        }
        
        .custom-dropdown.p-dropdown,
        .custom-dropdown.p-select,
        .custom-dropdown .p-dropdown,
        .custom-dropdown .p-select,
        .custom-dropdown .p-select-host,
        .custom-dropdown .p-dropdown-trigger,
        .custom-dropdown .p-select-trigger,
        .custom-dropdown .p-select-overlay {
            border-radius: 20px !important;
            height: 38px !important;
            display: flex !important;
            align-items: center !important;
            transition: all 0.25s ease !important;
        }
        
        .custom-dropdown.p-dropdown,
        .custom-dropdown.p-select {
            border-color: #cbd5e1 !important;
        }
        
        .custom-dropdown.p-dropdown:hover,
        .custom-dropdown.p-select:hover {
            border-color: #94a3b8 !important;
        }
        
        .custom-dropdown.p-dropdown.p-focus,
        .custom-dropdown.p-select.p-focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }
        
        .custom-dropdown.p-dropdown .p-dropdown-label,
        .custom-dropdown.p-select .p-select-label {
            padding: 0.5rem 1rem !important;
            font-size: 0.9rem !important;
            color: #1e293b !important;
            display: flex !important;
            align-items: center !important;
        }
        
        .custom-dropdown.p-dropdown .p-dropdown-clear-icon,
        .custom-dropdown.p-select .p-select-clear-icon {
            right: 2.25rem !important;
            color: #94a3b8 !important;
        }
    }

    /* Action Buttons styling */
    :host ::ng-deep {
        .btn-action-in.p-button, .btn-action-out.p-button {
            border-radius: 20px !important;
            padding: 0.5rem 1.25rem !important;
            font-size: 0.9rem !important;
            font-weight: 600 !important;
            height: 38px !important;
        }
    }

    /* Responsive */
    @media (max-width: 992px) {
        .stock-header-container {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }
        .stock-actions-section {
            flex-wrap: wrap;
            width: 100%;
        }
        .filter-search-container {
            width: 100%;
            flex: 1;
        }
        .category-dropdown-wrapper {
            width: 100%;
            flex: 1;
        }
        .action-buttons-group {
            width: 100%;
            justify-content: flex-end;
        }
    }
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
