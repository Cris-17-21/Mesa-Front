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
        <h2>{{ isEditing ? 'Editar' : 'Nuevo' }} Producto</h2>

        <form [formGroup]="form" style="display:flex;flex-direction:column;gap:1rem;">

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">

                <!-- Nombre -->
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:.3rem;">Nombre del Producto *</label>
                    <input type="text" formControlName="nombreProducto" style="width:100%;padding:.5rem;border:1px solid #ced4da;border-radius:6px;" placeholder="Ej: Coca-Cola 500ml"/>
                </div>

                <!-- Categoría -->
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:.3rem;">Categoría *</label>
                    <select formControlName="idCategoria" style="width:100%;padding:.5rem;border:1px solid #ced4da;border-radius:6px;height:2.4rem;" (change)="onCategoriaChange($event)">
                        <option [ngValue]="null">-- Seleccione --</option>
                        <option *ngFor="let c of categorias" [value]="c.idCategoria">{{ c.nombreCategoria }}</option>
                    </select>
                </div>

                <!-- Tipos (multiselect nativo) -->
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:.3rem;">Tipos de Producto</label>
                    <select formControlName="idTipos" multiple style="width:100%;padding:.5rem;border:1px solid #ced4da;border-radius:6px;height:5rem;">
                        <option *ngFor="let t of filteredTipos" [value]="t.idTipo">{{ t.nombreTipo }}</option>
                    </select>
                    <small style="color:#6c757d;">Ctrl+clic para seleccionar varios</small>
                </div>

                <!-- Proveedor -->
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:.3rem;">Proveedor</label>
                    <select formControlName="idProveedor" style="width:100%;padding:.5rem;border:1px solid #ced4da;border-radius:6px;height:2.4rem;">
                        <option [ngValue]="null">-- Seleccione --</option>
                        <option *ngFor="let p of proveedores" [value]="p.idProveedor">{{ p.razonSocial }}</option>
                    </select>
                </div>

                <!-- Precio Venta -->
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:.3rem;">Precio Venta (S/) *</label>
                    <input type="number" formControlName="precioVenta" style="width:100%;padding:.5rem;border:1px solid #ced4da;border-radius:6px;" placeholder="0.00" step="0.01" min="0"/>
                </div>

                <!-- Costo Compra -->
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:.3rem;">Costo Compra (S/)</label>
                    <input type="number" formControlName="costoCompra" style="width:100%;padding:.5rem;border:1px solid #ced4da;border-radius:6px;" placeholder="0.00" step="0.01" min="0"/>
                </div>

                <!-- Stock -->
                <div>
                    <label style="display:block;font-weight:600;margin-bottom:.3rem;">Stock Inicial</label>
                    <input type="number" formControlName="stock" style="width:100%;padding:.5rem;border:1px solid #ced4da;border-radius:6px;" placeholder="0" min="0"/>
                </div>

            </div>

            <div style="display:flex;justify-content:flex-end;gap:.8rem;margin-top:1rem;">
                <button type="button" (click)="onCancel()" style="padding:.5rem 1.5rem;border-radius:6px;border:1px solid #6c757d;background:#fff;color:#6c757d;cursor:pointer;">Cancelar</button>
                <button type="button" (click)="onSubmit()" style="padding:.5rem 1.5rem;border-radius:6px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-weight:600;">{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
            </div>

        </form>
    </div>
    `,
    styles: [`:host { display: block; }`]
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
        alert('Guardando: ' + JSON.stringify(data));

        if (this.isEditing && this.currentId) {
            this.productoService.updateProducto(this.currentId, data).subscribe({
                next: () => alert('Producto actualizado correctamente'),
                error: (err) => alert('ERROR al actualizar: ' + JSON.stringify(err))
            });
        } else {
            this.productoService.createProducto(data).subscribe({
                next: () => alert('Producto creado correctamente'),
                error: (err) => alert('ERROR al crear: ' + JSON.stringify(err))
            });
        }
    }

    onCancel() {
        this.router.navigate(['/compras/productos']);
    }
}
