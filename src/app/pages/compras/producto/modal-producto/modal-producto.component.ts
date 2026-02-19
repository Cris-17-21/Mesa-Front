import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductoService } from '../../../../services/inventario/producto.service';
import { CategoriaService } from '../../../../services/inventario/categoria.service';
import { TipoProductoService } from '../../../../services/inventario/tipo-producto.service';
import { ProveedorService } from '../../../../services/compras/proveedor.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { Categoria } from '../../../../models/inventario/categoria.model';
import { TipoProducto } from '../../../../models/inventario/tipo-producto.model';
import { Proveedor } from '../../../../models/compras/proveedor.model';

@Component({
    selector: 'app-modal-producto',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        ButtonModule,
        CardModule,
        ToastModule,
        RouterModule,
        DropdownModule,
        MultiSelectModule,
        InputNumberModule
    ],
    providers: [MessageService],
    template: `
    <div class="card p-4" style="max-width: 800px; margin: 2rem auto;">
        <p-toast></p-toast>
        <h2>{{ isEditing ? 'Editar' : 'Nuevo' }} Producto</h2>
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-column gap-3">
            
            <div class="grid">
                <!-- Nombre -->
                <div class="col-12 md:col-6 field">
                    <label for="nombreProducto" class="block font-bold mb-2">Nombre del Producto</label>
                    <input id="nombreProducto" type="text" pInputText formControlName="nombreProducto" class="w-full"/>
                </div>

                <!-- Categoría -->
                <div class="col-12 md:col-6 field">
                    <label for="idCategoria" class="block font-bold mb-2">Categoría</label>
                    <p-dropdown [options]="categorias" formControlName="idCategoria" optionLabel="nombre" optionValue="id" placeholder="Seleccione Categoría" [style]="{width: '100%'}" (onChange)="onCategoriaChange($event)"></p-dropdown>
                </div>

                <!-- Tipos (Dependiente de Categoría) -->
                <div class="col-12 md:col-6 field">
                    <label for="idTipos" class="block font-bold mb-2">Tipos de Producto</label>
                    <p-multiSelect [options]="filteredTipos" formControlName="idTipos" optionLabel="nombre" optionValue="id" placeholder="Seleccione Tipos" [style]="{width: '100%'}"></p-multiSelect>
                </div>

                <!-- Proveedor -->
                <div class="col-12 md:col-6 field">
                    <label for="idProveedor" class="block font-bold mb-2">Proveedor</label>
                    <p-dropdown [options]="proveedores" formControlName="idProveedor" optionLabel="razonSocial" optionValue="idProveedor" placeholder="Seleccione Proveedor" [style]="{width: '100%'}" [filter]="true" filterBy="razonSocial"></p-dropdown>
                </div>

                <!-- Precio Venta -->
                <div class="col-12 md:col-6 field">
                    <label for="precioVenta" class="block font-bold mb-2">Precio Venta</label>
                    <p-inputNumber id="precioVenta" formControlName="precioVenta" mode="currency" currency="PEN" locale="es-PE" class="w-full"></p-inputNumber>
                </div>

                <!-- Costo Compra -->
                <div class="col-12 md:col-6 field">
                    <label for="costoCompra" class="block font-bold mb-2">Costo Compra</label>
                    <p-inputNumber id="costoCompra" formControlName="costoCompra" mode="currency" currency="PEN" locale="es-PE" class="w-full"></p-inputNumber>
                </div>

                <!-- Stock -->
                <div class="col-12 md:col-6 field">
                    <label for="stock" class="block font-bold mb-2">Stock Inicial</label>
                    <p-inputNumber id="stock" formControlName="stock" class="w-full"></p-inputNumber>
                </div>
            </div>

            <div class="flex justify-content-end gap-2 mt-4">
                <button pButton type="button" label="Cancelar" class="p-button-secondary" (click)="onCancel()"></button>
                <button pButton type="submit" [label]="isEditing ? 'Actualizar' : 'Guardar'" [disabled]="form.invalid"></button>
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
            nombreProducto: ['', Validators.required],
            idCategoria: [null, Validators.required],
            idTipos: [[]],
            idProveedor: [null, Validators.required],
            precioVenta: [null, Validators.required],
            costoCompra: [null],
            stock: [0, Validators.required],
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
        this.filterTipos(event.value);
        this.form.patchValue({ idTipos: [] }); // Reset types when category changes
    }

    filterTipos(categoryId: number) {
        this.filteredTipos = this.tipos.filter(t => t.idCategoria === categoryId);
    }

    onSubmit() {
        if (this.form.invalid) return;
        const data = this.form.value;

        if (this.isEditing && this.currentId) {
            this.productoService.updateProducto(this.currentId, data).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado' });
                    setTimeout(() => this.router.navigate(['/compras/productos']), 1000);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar' })
            });
        } else {
            this.productoService.createProducto(data).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto creado' });
                    setTimeout(() => this.router.navigate(['/compras/productos']), 1000);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear' })
            });
        }
    }

    onCancel() {
        this.router.navigate(['/compras/productos']);
    }
}
