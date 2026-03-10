import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouterModule, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductoService } from '../../../services/inventario/producto.service';
import { CompraService, PedidoCompraDto } from '../../../services/compra/compra.service';
import { Producto } from '../../../models/inventario/producto.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
    selector: 'app-producto',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, RouterModule, ConfirmDialogModule, ToastModule, DialogModule, HasPermissionDirective],
    providers: [ConfirmationService, MessageService],
    template: `
    <div class="card p-4">
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
        
        <div class="flex justify-content-between align-items-center mb-4">
            <h2 class="m-0">Gestión de Productos</h2>
             <div class="flex gap-2">
                 <button pButton label="Productos Simples" class="p-button-outlined p-button-info" icon="bi bi-list" (click)="abrirModalSimples()"></button>
                 <button *appHasPermission="'CREATE_PRODUCTO'" pButton label="Nuevo Producto" icon="bi bi-plus" (click)="createProducto()"></button>
             </div>
        </div>

        <p-table [value]="productos" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
                <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-producto>
                <tr>
                    <td>{{ producto.nombreProducto }}</td>
                    <td>{{ producto.nombreCategoria || 'Sin Categoría' }}</td>
                    <td>{{ producto.razonSocialProveedor || 'Sin Proveedor' }}</td>
                    <td>{{ producto.precioVenta | currency }}</td>
                    <td>{{ producto.stock }}</td>
                    <td>
                        <span [class]="'product-badge status-' + (producto.stock > 0 ? 'instock' : 'outofstock')">
                            {{ producto.stock > 0 ? 'Disponible' : 'Agotado' }}
                        </span>
                    </td>
                    <td>
                        <button *appHasPermission="'UPDATE_PRODUCTO'" pButton icon="bi bi-pencil" class="p-button-rounded p-button-text p-button-warning mr-2" (click)="editProducto(producto.idProducto)"></button>
                        <button *appHasPermission="'DELETE_PRODUCTO'" pButton icon="bi bi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteProducto(producto)"></button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="7">No hay productos registrados.</td></tr>
            </ng-template>
        </p-table>
    </div>

    <!-- Modal para Productos Simples (Compras Informales) -->
    <p-dialog header="Compras Simples (Informales)" [(visible)]="mostrarModalSimples" [modal]="true" [style]="{width: '70vw'}" [draggable]="false" [resizable]="false">
        <p-table [value]="comprasSimples" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template pTemplate="header">
                <tr>
                    <th>Fecha</th>
                    <th>Proveedor Informal</th>
                    <th>Referencia</th>
                    <th>Total</th>
                    <th>Productos (Cant.)</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-compra>
                <tr>
                    <td>{{ compra.fechaPedido | date:'dd/MM/yyyy' }}</td>
                    <td>{{ compra.nombreProveedorInformal || 'N/A' }}</td>
                    <td>{{ compra.referencia || '-' }}</td>
                    <td>{{ compra.totalPedido | currency }}</td>
                    <td>
                        <ul style="margin: 0; padding-left: 1.2rem;">
                            <li *ngFor="let d of compra.detalles">{{ d.nombreProducto }} (x{{ d.cantidadPedida }})</li>
                        </ul>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="5">No hay compras simples registradas.</td></tr>
            </ng-template>
        </p-table>
        <ng-template pTemplate="footer">
            <button pButton label="Cerrar" icon="pi pi-times" class="p-button-text" (click)="mostrarModalSimples = false"></button>
        </ng-template>
    </p-dialog>
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
        .status-instock {
            background: #C8E6C9;
            color: #256029;
        }
        .status-outofstock {
            background: #FFCDD2;
            color: #C63737;
        }
    `]
})
export class ProductoComponent implements OnInit {
    private productoService = inject(ProductoService);
    private compraService = inject(CompraService);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    productos: Producto[] = [];
    comprasSimples: PedidoCompraDto[] = [];
    mostrarModalSimples = false;

    ngOnInit() {
        this.loadProductos();
    }

    loadProductos() {
        this.productoService.getAllProductos().subscribe({
            next: (data) => this.productos = data,
            error: (err) => console.error('Error loading productos', err)
        });
    }

    abrirModalSimples() {
        this.mostrarModalSimples = true;
        this.compraService.getAll().subscribe({
            next: (compras) => {
                // Filter only simple purchases
                this.comprasSimples = compras.filter(c => c.esCompraSimple === true);
            },
            error: (err) => console.error('Error loading compras', err)
        });
    }

    createProducto() {
        this.router.navigate(['/compras/productos/nuevo']);
    }

    editProducto(id: number) {
        this.router.navigate(['/compras/productos/editar', id]);
    }

    deleteProducto(producto: Producto) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar ${producto.nombreProducto}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.productoService.deleteProducto(producto.idProducto).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado' });
                        this.loadProductos();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto' });
                    }
                });
            }
        });
    }
}
