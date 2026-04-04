import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouterModule, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductoService } from '../../../services/inventario/producto.service';
import { CompraService, PedidoCompraDto, RecepcionPedidoRequest } from '../../../services/compra/compra.service';
import { Producto } from '../../../models/inventario/producto.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { PlatoDashboardComponent } from './plato-dashboard/plato-dashboard.component';

@Component({
    selector: 'app-producto',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, RouterModule, ConfirmDialogModule, ToastModule, DialogModule, TooltipModule, RadioButtonModule, TextareaModule, HasPermissionDirective, PlatoDashboardComponent],
    providers: [ConfirmationService, MessageService],
    template: `
    <div class="card p-4">
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
        
        <div class="flex justify-content-between align-items-center mb-4">
            <h2 class="m-0">Gestión de Productos</h2>
        </div>
        
        <!-- Tabs Superiores tipo Botón -->
        <div class="flex gap-1 mb-4 border-bottom-1 surface-border pb-3">
            <button *appHasPermission="'READ_PRODUCTO'" pButton class="p-button p-button-outlined" [ngClass]="{'bg-cyan-100 text-cyan-900 border-cyan-500 font-bold': activeTab === 'NUEVO', 'surface-100 text-500 border-transparent': activeTab !== 'NUEVO'}" icon="bi bi-list" label="+ Nuevo Producto" (click)="activeTab = 'NUEVO'"></button>
            <button *appHasPermission="'READ_PRODUCTO'" pButton class="p-button p-button-outlined" [ngClass]="{'bg-yellow-100 text-yellow-900 border-yellow-500 font-bold': activeTab === 'SIMPLE', 'surface-100 text-500 border-transparent': activeTab !== 'SIMPLE'}" icon="bi bi-list-nested" label="= Producto Simple" (click)="activeTab = 'SIMPLE'"></button>
            <button *appHasPermission="'VIEW_PLATO_SALES'" pButton class="p-button p-button-outlined" [ngClass]="{'bg-cyan-100 text-cyan-900 border-cyan-500 font-bold': activeTab === 'PLATO', 'surface-100 text-500 border-transparent': activeTab !== 'PLATO'}" icon="bi bi-cup-hot" label="+ Plato Nuevo" (click)="activeTab = 'PLATO'"></button>
        </div>

        <div class="flex justify-content-end mb-3" *ngIf="activeTab === 'NUEVO'">
            <button *appHasPermission="'CREATE_PRODUCTO'" pButton label="Crear Nuevo Producto" icon="bi bi-plus" class="p-button-sm" (click)="createProducto()"></button>
        </div>

        <!-- Pantalla 1: Nuevo Producto -->
        <p-table *ngIf="activeTab === 'NUEVO'" [value]="productosNormales" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
                <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Fecha</th>
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
                    <td>{{ producto.fechaRegistro ? (producto.fechaRegistro | date:'dd/MM/yyyy') : '-' }}</td>
                    <td>S/ {{ producto.precioVenta | number:'1.2-2' }}</td>
                    <td>{{ producto.stock }}</td>
                    <td>
                        <span [class]="'product-badge status-' + (producto.stock > 0 ? 'instock' : 'outofstock')">
                            {{ producto.stock > 0 ? 'Disponible' : 'Agotado' }}
                        </span>
                    </td>
                    <td>
                        <button *appHasPermission="'UPDATE_PRODUCTO'" pButton icon="bi bi-pencil" class="p-button-rounded p-button-text p-button-warning mr-2" (click)="editProducto(producto.idProducto)"></button>
                        <button pButton icon="bi bi-truck" class="p-button-rounded p-button-text p-button-success mr-2" pTooltip="Recepcionar" tooltipPosition="top" (click)="abrirRecepcionDesdeProducto(producto)"></button>
                        <button *appHasPermission="'DELETE_PRODUCTO'" pButton icon="bi bi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteProducto(producto)"></button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="8">No hay productos registrados.</td></tr>
            </ng-template>
        </p-table>

        <!-- Pantalla 2: Producto Simple -->
        <p-table *ngIf="activeTab === 'SIMPLE'" [value]="productosSimples" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
                <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Fecha</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-producto>
                <tr>
                    <td>{{ producto.nombreProducto }}</td>
                    <td>{{ producto.nombreCategoria || 'Sin Categoría' }}</td>
                    <td>{{ producto.razonSocialProveedor || 'Sin Proveedor' }}</td>
                    <td>{{ producto.fechaRegistro ? (producto.fechaRegistro | date:'dd/MM/yyyy') : '-' }}</td>
                    <td>S/ {{ producto.precioVenta | number:'1.2-2' }}</td>
                    <td>{{ producto.stock }}</td>
                    <td>
                        <button *appHasPermission="'UPDATE_PRODUCTO'" pButton icon="bi bi-pencil" class="p-button-rounded p-button-text p-button-warning mr-2" (click)="editProducto(producto.idProducto)"></button>
                        <button pButton icon="bi bi-truck" class="p-button-rounded p-button-text p-button-success mr-2" pTooltip="Recepcionar" tooltipPosition="top" (click)="abrirRecepcionDesdeProducto(producto)"></button>
                        <button *appHasPermission="'DELETE_PRODUCTO'" pButton icon="bi bi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteProducto(producto)"></button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="7">No hay productos simples registrados.</td></tr>
            </ng-template>
        </p-table>

        <!-- Pantalla 3: Platos -->
        <app-plato-dashboard *ngIf="activeTab === 'PLATO'"></app-plato-dashboard>
    </div>



    <!-- Modal para Recepción desde Producto -->
    <p-dialog header="Registrar recepción" [(visible)]="mostrarRecepcion" [modal]="true" [style]="{width: '75vw', maxWidth: '800px'}">
        <div class="surface-ground p-3 border-round mb-4" *ngIf="compraSeleccionada">
            <div class="flex justify-content-between mb-2">
                <div>
                    <strong>Compra:</strong> {{compraSeleccionada.idPedidoCompra || compraSeleccionada.referencia || 'N/A'}}<br>
                    <strong>Proveedor:</strong> {{compraSeleccionada.razonSocialProveedor || compraSeleccionada.nombreProveedorInformal || 'N/A'}}
                </div>
                <div class="text-right">
                    <strong>Estado actual:</strong> {{compraSeleccionada.estadoPedido}}<br>
                    <strong>Total pendiente:</strong> {{totalPendiente}} unidades
                </div>
            </div>
        </div>

        <div class="flex gap-4 mb-4" *ngIf="compraSeleccionada">
            <div class="flex align-items-center">
                <p-radioButton name="tipoRecepcion" value="parcial" [(ngModel)]="tipoRecepcion" inputId="tipo1" (onClick)="onTipoRecepcionChange()"></p-radioButton>
                <label for="tipo1" class="ml-2">Recepción parcial</label>
            </div>
            <div class="flex align-items-center">
                <p-radioButton name="tipoRecepcion" value="total" [(ngModel)]="tipoRecepcion" inputId="tipo2" (onClick)="onTipoRecepcionChange()"></p-radioButton>
                <label for="tipo2" class="ml-2">Recepción total (recibir todo lo pendiente)</label>
            </div>
        </div>

        <p-table [value]="detallesPendientes" styleClass="p-datatable-sm" responsiveLayout="scroll">
            <ng-template pTemplate="header">
                <tr>
                    <th>Producto</th>
                    <th class="text-center">Pedida</th>
                    <th class="text-center">Recibida</th>
                    <th class="text-center">Pendiente</th>
                    <th class="text-center" style="width: 150px">Recibir ahora</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-detalle>
                <tr>
                    <td><strong>{{detalle.nombreProducto}}</strong></td>
                    <td class="text-center">{{detalle.cantidadPedida}}</td>
                    <td class="text-center">{{detalle.cantidadRecibida || 0}}</td>
                    <td class="text-center">{{detalle.cantidadPedida - (detalle.cantidadRecibida || 0)}}</td>
                    <td class="text-center">
                        <input type="number" pInputText [(ngModel)]="detalle.cantidadARecibir" 
                               [max]="detalle.cantidadPedida - (detalle.cantidadRecibida || 0)" [min]="0" class="w-full form-control text-center"
                               (ngModelChange)="validarCantidad(detalle); tipoRecepcion = 'parcial'">
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="5" class="text-center p-4">No hay productos pendientes por recibir.</td>
                </tr>
            </ng-template>
        </p-table>

        <div class="mt-4">
            <label for="observaciones" class="block font-bold mb-2">Observaciones de Recepción</label>
            <textarea id="observaciones" pInputTextarea [(ngModel)]="observacionesRecepcion" rows="2" class="w-full form-control"></textarea>
        </div>

        <ng-template pTemplate="footer">
            <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="mostrarRecepcion = false"></p-button>
            <p-button label="Registrar recepción" icon="bi bi-truck" (onClick)="confirmarRecepcion()" [disabled]="!puedeRecibir()" severity="danger"></p-button>
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

    productosNormales: Producto[] = [];
    productosSimples: Producto[] = [];
    comprasSimples: PedidoCompraDto[] = [];

    activeTab: 'NUEVO' | 'SIMPLE' | 'PLATO' = 'NUEVO';

    // Recepción State
    mostrarRecepcion = false;
    compraSeleccionada: PedidoCompraDto | null = null;
    tipoRecepcion: 'total' | 'parcial' = 'parcial';
    detallesPendientes: any[] = [];
    totalPendiente: number = 0;
    observacionesRecepcion: string = '';

    ngOnInit() {
        this.loadProductos();
    }

    loadProductos() {
        this.productoService.getAllProductos().subscribe({
            next: (data) => {
                this.productosNormales = data.filter(p => p.tipo !== 'INFORMAL' && !p.esPlato);
                this.productosSimples = data.filter(p => p.tipo === 'INFORMAL' && !p.esPlato);
            },
            error: (err) => console.error('Error loading productos', err)
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

    // --- Lógica de Recepción ---
    abrirRecepcionDesdeProducto(producto: Producto) {
        this.compraService.getAll().subscribe({
            next: (compras) => {
                const comprasPendientes = compras.filter(c =>
                    (c.estadoPedido === 'Pendiente' || c.estadoPedido === 'PENDIENTE') &&
                    c.detalles?.some(d => d.idProducto === producto.idProducto && (d.cantidadPedida - ((d as any).cantidadRecibida || 0)) > 0)
                );

                if (comprasPendientes.length > 0) {
                    // Seleccionar la primera compra pendiente encontrada para este producto
                    this.compraSeleccionada = comprasPendientes[0];
                    this.tipoRecepcion = 'total';
                    this.observacionesRecepcion = '';

                    this.detallesPendientes = (this.compraSeleccionada.detalles || [])
                        .map(d => ({
                            idDetallePedido: d.idDetallePedido,
                            nombreProducto: d.nombreProducto,
                            cantidadPedida: d.cantidadPedida || 0,
                            cantidadRecibida: (d as any).cantidadRecibida || 0,
                            cantidadARecibir: 0
                        }))
                        .filter(d => (d.cantidadPedida - d.cantidadRecibida) > 0);

                    this.totalPendiente = this.detallesPendientes.reduce((acc, curr) => acc + (curr.cantidadPedida - curr.cantidadRecibida), 0);
                    this.onTipoRecepcionChange();
                    this.mostrarRecepcion = true;
                } else {
                    this.messageService.add({ severity: 'info', summary: 'Aviso', detail: 'No hay pedidos de compra pendientes por recibir para este producto.' });
                }
            },
            error: (err) => console.error(err)
        });
    }

    onTipoRecepcionChange() {
        if (this.tipoRecepcion === 'total') {
            this.detallesPendientes.forEach(d => d.cantidadARecibir = d.cantidadPedida - d.cantidadRecibida);
        } else {
            this.detallesPendientes.forEach(d => d.cantidadARecibir = 0);
        }
    }

    validarCantidad(detalle: any) {
        const pendiente = detalle.cantidadPedida - detalle.cantidadRecibida;
        if (detalle.cantidadARecibir < 0) detalle.cantidadARecibir = 0;
        if (detalle.cantidadARecibir > pendiente) detalle.cantidadARecibir = pendiente;
    }

    puedeRecibir(): boolean {
        return this.detallesPendientes.some(d => d.cantidadARecibir > 0);
    }

    confirmarRecepcion() {
        if (!this.compraSeleccionada || !this.compraSeleccionada.idPedidoCompra) return;

        const request: RecepcionPedidoRequest = {
            detalles: this.detallesPendientes
                .filter(d => d.cantidadARecibir > 0)
                .map(d => ({
                    idDetallePedido: d.idDetallePedido,
                    cantidadRecibida: d.cantidadARecibir
                })),
            observaciones: this.observacionesRecepcion
        };

        this.compraService.registrarRecepcion(this.compraSeleccionada.idPedidoCompra, request).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Recepción registrada correctamente' });
                this.mostrarRecepcion = false;
                this.loadProductos(); // Recargar stock real !!
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la recepción' });
            }
        });
    }
}
