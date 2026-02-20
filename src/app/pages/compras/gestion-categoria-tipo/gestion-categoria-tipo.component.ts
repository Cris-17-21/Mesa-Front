import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { CategoriaService } from '../../../services/inventario/categoria.service';
import { TipoProductoService } from '../../../services/inventario/tipo-producto.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Categoria } from '../../../models/inventario/categoria.model';
import { TipoProducto } from '../../../models/inventario/tipo-producto.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
    selector: 'app-gestion-categoria-tipo',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        DropdownModule,
        HasPermissionDirective
    ],
    providers: [MessageService, ConfirmationService],
    template: `
    <div class="card p-4">
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
        
        <h2 class="mb-4">Clasificación de Productos</h2>

        <div class="panel-contenedor">
            <!-- Categorías (Izquierda) -->
            <div class="panel-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3 style="margin:0">Categorías</h3>
                    <button *appHasPermission="'CREATE_CATEGORIA'" pButton label="Nueva" icon="bi bi-plus" (click)="openCategoriaDialog()"></button>
                </div>
                
                <p-table [value]="categorias" [scrollable]="true" scrollHeight="400px" selectionMode="single" [(selection)]="selectedCategoria" (onRowSelect)="onCategoriaSelect($event)" dataKey="idCategoria">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Nombre</th>
                            <th style="width: 100px">Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-cat>
                        <tr [pSelectableRow]="cat">
                            <td>{{ cat.nombreCategoria }}</td>
                            <td>
                                <button *appHasPermission="'UPDATE_CATEGORIA'" pButton icon="bi bi-pencil" class="p-button-rounded p-button-text p-button-warning mr-1" (click)="editCategoria(cat)"></button>
                                <button *appHasPermission="'DELETE_CATEGORIA'" pButton icon="bi bi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteCategoria(cat)"></button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr><td colspan="2">No hay categorías.</td></tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- Tipos de Producto (Derecha) -->
            <div class="panel-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3 style="margin:0">Tipos de Producto</h3>
                    <button *appHasPermission="'CREATE_TIPOPRODUCTO'" pButton label="Nuevo Tipo" icon="bi bi-plus" (click)="openTipoDialog()"></button>
                </div>
                <div style="margin-bottom:0.5rem;" *ngIf="selectedCategoria">
                    <small style="color:#6c757d">Filtrado por: <strong>{{ selectedCategoria.nombreCategoria }}</strong></small>
                    <button pButton icon="pi pi-times" class="p-button-rounded p-button-text p-button-sm" style="margin-left:0.5rem" (click)="clearFilter()" pTooltip="Ver todos"></button>
                </div>

                <p-table [value]="filteredTipos" [scrollable]="true" scrollHeight="400px">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Nombre</th>
                            <th *ngIf="!selectedCategoria">Categoría</th>
                            <th style="width: 100px">Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-tipo>
                        <tr>
                            <td>{{ tipo.nombreTipo }}</td>
                            <td *ngIf="!selectedCategoria">{{ getCategoriaName(tipo.idCategoria) }}</td>
                            <td>
                                <button *appHasPermission="'UPDATE_TIPOPRODUCTO'" pButton icon="bi bi-pencil" class="p-button-rounded p-button-text p-button-warning mr-1" (click)="editTipo(tipo)"></button>
                                <button *appHasPermission="'DELETE_TIPOPRODUCTO'" pButton icon="bi bi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteTipo(tipo)"></button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr><td colspan="3">No hay tipos registrados.</td></tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- Dialog Categoria -->
        <p-dialog [(visible)]="categoriaDialog" [style]="{width: '400px'}" header="Categoría" [modal]="true">
            <form [formGroup]="categoriaForm" (ngSubmit)="saveCategoria()">
                <div class="field">
                    <label for="catNombre">Nombre</label>
                    <input type="text" pInputText id="catNombre" formControlName="nombre" class="w-full" autofocus />
                </div>
                <div class="field">
                    <label for="catDesc">Descripción</label>
                    <input type="text" pInputText id="catDesc" formControlName="descripcion" class="w-full" />
                </div>
                <div class="flex justify-content-end gap-2 mt-4">
                    <button pButton label="Cancelar" class="p-button-text" (click)="categoriaDialog = false"></button>
                    <button pButton label="Guardar" type="submit" [disabled]="categoriaForm.invalid"></button>
                </div>
            </form>
        </p-dialog>

        <!-- Dialog Tipo -->
        <p-dialog [(visible)]="tipoDialog" [style]="{width: '400px'}" header="Tipo de Producto" [modal]="true">
             <form [formGroup]="tipoForm" (ngSubmit)="saveTipo()">
                <div class="field">
                    <label for="tipoNombre">Nombre</label>
                    <input type="text" pInputText id="tipoNombre" formControlName="nombreTipo" class="w-full" autofocus />
                </div>
                 <div class="field">
                    <label for="tipoCat">Categoría</label>
                    <p-dropdown [options]="categorias" formControlName="idCategoria" optionLabel="nombreCategoria" optionValue="idCategoria" placeholder="Seleccione Categoría" [style]="{width: '100%'}" appendTo="body"></p-dropdown>
                </div>
                <div class="flex justify-content-end gap-2 mt-4">
                    <button pButton label="Cancelar" class="p-button-text" (click)="tipoDialog = false"></button>
                    <button pButton label="Guardar" type="submit" [disabled]="tipoForm.invalid"></button>
                </div>
            </form>
        </p-dialog>
    </div>
    `,
    styles: [`
        :host { display: block; }
        .panel-contenedor {
            display: flex;
            gap: 1.5rem;
            align-items: flex-start;
        }
        .panel-card {
            flex: 1;
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1.25rem;
            min-width: 0;
        }
        .p-button-rounded { width: 2rem; height: 2rem; }
    `]
})
export class GestionCategoriaTipoComponent implements OnInit {
    private categoriaService = inject(CategoriaService);
    private tipoService = inject(TipoProductoService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private fb = inject(FormBuilder);

    categorias: Categoria[] = [];
    tipos: TipoProducto[] = [];
    filteredTipos: TipoProducto[] = [];

    selectedCategoria: Categoria | null = null;
    displayAllTypes = true;

    // Forms
    categoriaForm: FormGroup;
    tipoForm: FormGroup;

    // Dialogs
    categoriaDialog = false;
    tipoDialog = false;
    isEditing = false;
    currentId: number | null = null;

    constructor() {
        this.categoriaForm = this.fb.group({
            nombre: ['', Validators.required],
            descripcion: ['']
        });

        this.tipoForm = this.fb.group({
            nombreTipo: ['', Validators.required],
            idCategoria: [null, Validators.required]
        });
    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.categoriaService.getAll().subscribe(data => this.categorias = data);
        this.tipoService.getAll().subscribe(data => {
            this.tipos = data;
            this.filterTipos();
        });
    }

    onCategoriaSelect(event: any) {
        this.displayAllTypes = false;
        this.filterTipos();
    }

    clearFilter() {
        this.selectedCategoria = null;
        this.displayAllTypes = true;
        this.filterTipos();
    }

    filterTipos() {
        if (this.selectedCategoria) {
            this.filteredTipos = this.tipos.filter(t => t.idCategoria === this.selectedCategoria!.idCategoria);
        } else {
            this.filteredTipos = [...this.tipos];
        }
    }

    getCategoriaName(id: number): string {
        const cat = this.categorias.find(c => c.idCategoria === id);
        return cat ? cat.nombreCategoria : 'Sin Categoría';
    }

    // --- Categoria CRUD ---
    openCategoriaDialog() {
        this.isEditing = false;
        this.currentId = null;
        this.categoriaForm.reset();
        this.categoriaDialog = true;
    }

    editCategoria(cat: Categoria) {
        this.isEditing = true;
        this.currentId = cat.idCategoria;
        this.categoriaForm.patchValue({ nombre: cat.nombreCategoria });
        this.categoriaDialog = true;
    }

    saveCategoria() {
        if (this.categoriaForm.invalid) return;
        const formValue = this.categoriaForm.value;

        // CRÍTICO: El backend requiere empresaId para asociar la categoría
        const empresaId = this.authService.getClaim('empresaId');
        if (!empresaId) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontró la empresa. Por favor, cierra sesión y vuelve a entrar.' });
            return;
        }

        // CORRECCIÓN: El backend DTO espera 'nombreCategoria', no 'nombre'
        const data: any = {
            nombreCategoria: formValue.nombre,
            empresaId: empresaId
        };

        // DEBUG: verificar payload
        console.log('Payload Categoría (corregido):', data);

        if (this.isEditing && this.currentId) {
            this.categoriaService.update(this.currentId, data).subscribe(() => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría actualizada' });
                this.loadData();
                this.categoriaDialog = false;
            });
        } else {
            this.categoriaService.create(data).subscribe(() => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría creada' });
                this.loadData();
                this.categoriaDialog = false;
            });
        }
    }

    deleteCategoria(cat: Categoria) {
        this.confirmationService.confirm({
            message: `¿Eliminar la categoría ${cat.nombreCategoria}?`,
            accept: () => {
                this.categoriaService.delete(cat.idCategoria).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría eliminada' });
                    this.loadData();
                    if (this.selectedCategoria?.idCategoria === cat.idCategoria) this.clearFilter();
                });
            }
        });
    }

    // --- Tipo CRUD ---
    openTipoDialog() {
        this.isEditing = false;
        this.currentId = null;
        this.tipoForm.reset();
        // Pre-select category if one is selected
        if (this.selectedCategoria) {
            this.tipoForm.patchValue({ idCategoria: this.selectedCategoria.idCategoria });
        }
        this.tipoDialog = true;
    }

    editTipo(tipo: TipoProducto) {
        this.isEditing = true;
        this.currentId = tipo.idTipo;
        this.tipoForm.patchValue(tipo);
        this.tipoDialog = true;
    }

    saveTipo() {
        if (this.tipoForm.invalid) return;
        const data = this.tipoForm.value;

        if (this.isEditing && this.currentId) {
            this.tipoService.update(this.currentId, data).subscribe(() => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo actualizado' });
                this.loadData();
                this.tipoDialog = false;
            });
        } else {
            this.tipoService.create(data).subscribe(() => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo creado' });
                this.loadData();
                this.tipoDialog = false;
            });
        }
    }

    deleteTipo(tipo: TipoProducto) {
        this.confirmationService.confirm({
            message: `¿Eliminar el tipo ${tipo.nombreTipo}?`,
            accept: () => {
                this.tipoService.delete(tipo.idTipo).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo eliminado' });
                    this.loadData();
                });
            }
        });
    }
}
