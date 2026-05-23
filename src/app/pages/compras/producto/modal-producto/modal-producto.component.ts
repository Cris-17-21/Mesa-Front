import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductoService } from '../../../../services/inventario/producto.service';
import { CategoriaService } from '../../../../services/inventario/categoria.service';
import { TipoProductoService } from '../../../../services/inventario/tipo-producto.service';
import { ProveedorService } from '../../../../services/compra/proveedor.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Categoria } from '../../../../models/inventario/categoria.model';
import { TipoProducto } from '../../../../models/inventario/tipo-producto.model';
import { Proveedor } from '../../../../models/compra/proveedor.model';
import { AuthService } from '../../../../core/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-modal-producto',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
    <div class="card p-4" style="max-width: 800px; margin: 2rem auto;">
        <p-toast></p-toast>
        
        <div class="seccion-card">
            <div class="seccion-titulo">
                <!--<span class="icono">📦</span>-->
                <h3>{{ isEditing ? 'Editar' : 'Nuevo' }} Producto</h3>
            </div>
            <hr class="linea-roja" />

            <form [formGroup]="form" class="form-grid">

                <!-- Nombre -->
                <div class="field col-2">
                    <label>Nombre del Producto *</label>
                    <input type="text" class="campo-input" formControlName="nombreProducto" placeholder="Ej: Coca-Cola 500ml"/>
                </div>

                <!-- Categoría -->
                <div class="field col-2">
                    <label>Categoría *</label>
                    <select class="campo-input" formControlName="idCategoria" (change)="onCategoriaChange($event)">
                        <option [ngValue]="null">-- Seleccione --</option>
                        <option *ngFor="let c of categorias" [value]="c.idCategoria">{{ c.nombreCategoria }}</option>
                    </select>
                </div>

                <!-- Tipos (multiselect nativo) -->
                <div class="field col-2">
                    <label>Tipos de Producto</label>
                    <select class="campo-input" formControlName="idTipos" multiple style="height: 100px;">
                        <option *ngFor="let t of filteredTipos" [value]="t.idTipo">{{ t.nombreTipo }}</option>
                    </select>
                    <small style="color:#6c757d; font-size: 0.75rem;">Ctrl+clic para seleccionar varios</small>
                </div>

                <!-- Proveedor -->
                <div class="field col-2">
                    <label>Proveedor</label>
                    <select class="campo-input" formControlName="idProveedor">
                        <option [ngValue]="null">-- Seleccione --</option>
                        <option *ngFor="let p of proveedores" [value]="p.idProveedor">{{ p.razonSocial }}</option>
                    </select>
                </div>

                <!-- Precio Venta -->
                <div class="field col-2">
                    <label>Precio Venta (S/) *</label>
                    <input type="number" class="campo-input" formControlName="precioVenta" placeholder="0.00" step="0.01" min="0"/>
                </div>

                <!-- Costo Compra -->
                <div class="field col-2">
                    <label>Costo Compra (S/)</label>
                    <input type="number" class="campo-input" formControlName="costoCompra" placeholder="0.00" step="0.01" min="0"/>
                </div>

                <!-- Stock -->
                <div class="field col-2">
                    <label>Stock Inicial</label>
                    <input type="number" class="campo-input" formControlName="stock" placeholder="0" min="0"/>
                </div>

                <!-- Espaciador para alinear el grid de botones abajo a la derecha -->
                <div class="col-full" style="display:flex;justify-content:flex-end;gap:.8rem;margin-top:1rem;">
                    <button type="button" class="btn-cancel" (click)="onCancel()">Cancelar</button>
                    <button type="button" class="btn-save" (click)="onSubmit()">{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
                </div>

            </form>
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; }
        .seccion-card { background:#fff; border:1px solid #dee2e6; border-radius:10px; padding:1.5rem; }
        .seccion-titulo { display:flex; align-items:center; gap:.6rem; margin-bottom:.5rem; }
        .seccion-titulo h3 { margin:0; font-size:1.1rem; }
        .linea-roja { border:none; border-top:2px solid #a9b9b9ee; margin-bottom:1.2rem; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .field { display:flex; flex-direction:column; gap:.3rem; }
        .field label { font-weight:600; font-size:.85rem; color:#495057; }
        .col-2 { grid-column: span 1; }
        .col-full { grid-column: 1 / -1; }
        .campo-input { border:1px solid #ced4da; border-radius:6px; padding:.5rem .75rem; font-size:.9rem; width:100%; box-sizing:border-box; }
        .campo-input:focus { outline:none; border-color:#c0392b; box-shadow:0 0 0 2px rgba(192,57,43,.15); }
        .btn-cancel { padding:.5rem 1.5rem; border-radius:6px; border:1px solid #6c757d; background:#fff; color:#6c757d; cursor:pointer; }
        .btn-save { padding:.5rem 1.5rem; border-radius:6px; border:none; background:#3b82f6; color:#fff; cursor:pointer; font-weight:600; }
        .btn-save:hover { background:#2563eb; }
    `]
})
export class ModalProductoComponent implements OnInit {
    private fb = inject(FormBuilder);
    private productoService = inject(ProductoService);
    private categoriaService = inject(CategoriaService);
    private tipoService = inject(TipoProductoService);
    private proveedorService = inject(ProveedorService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);

    form: FormGroup;
    isEditing = false;
    currentId: number | null = null;

    categorias: Categoria[] = [];
    tipos: TipoProducto[] = [];
    filteredTipos: TipoProducto[] = [];
    proveedores: Proveedor[] = [];

    constructor() {
        this.form = this.fb.group({
            nombreProducto: [''],
            idCategoria: [null],
            idTipos: [[]],
            idProveedor: [null],
            precioVenta: [null],
            costoCompra: [null],
            stock: [0],
            estado: [true]
        });
    }

    ngOnInit() {
        this.loadCombos();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditing = true;
            this.currentId = +id;
            this.loadProducto(this.currentId);
        }
    }

    loadCombos() {
        this.categoriaService.getAll().subscribe(data => this.categorias = data);
        this.tipoService.getAll().subscribe(data => this.tipos = data); // Load all types initially
        this.proveedorService.getAllProveedores().subscribe(data => this.proveedores = data);
    }

    loadProducto(id: number) {
        this.productoService.getProductoById(id).subscribe({
            next: (data) => {
                this.form.patchValue(data);
                // Trigger filter manually if category is loaded
                if (data.idCategoria) {
                    this.filterTipos(data.idCategoria);
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el producto' });
                this.router.navigate(['/compras/productos']);
            }
        });
    }

    onCategoriaChange(event: any) {
        const categoryId = +(event.target?.value ?? event.value);
        this.filterTipos(categoryId);
        this.form.patchValue({ idTipos: [] });
    }

    filterTipos(categoryId: number) {
        this.filteredTipos = this.tipos.filter(t => t.idCategoria === categoryId);
    }

    onSubmit() {
        const data = this.form.value;
        const sucursalId = this.authService.getClaim('sucursalId');
        if (sucursalId) {
            data.sucursalId = sucursalId;
        }

        if (this.isEditing && this.currentId) {
            this.productoService.updateProducto(this.currentId, data).subscribe({
                next: () => {
                    Swal.fire('Éxito', 'Producto actualizado correctamente', 'success').then(() => {
                        this.router.navigate(['/compras/productos']);
                    });
                },
                error: (err) => Swal.fire('Error', err.error?.message || 'ERROR al actualizar', 'error')
            });
        } else {
            this.productoService.createProducto(data).subscribe({
                next: () => {
                    Swal.fire('Éxito', 'Producto creado correctamente', 'success').then(() => {
                        this.router.navigate(['/compras/productos']);
                    });
                },
                error: (err) => Swal.fire('Error', err.error?.message || 'ERROR al crear', 'error')
            });
        }
    }

    onCancel() {
        this.router.navigate(['/compras/productos']);
    }
}
