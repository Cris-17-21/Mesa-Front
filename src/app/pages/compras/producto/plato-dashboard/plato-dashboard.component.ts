import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../../services/inventario/producto.service';
import { Producto, PlatoSalesHistory } from '../../../../models/inventario/producto.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { CategoriaService } from '../../../../services/inventario/categoria.service';
import { Categoria } from '../../../../models/inventario/categoria.model';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
    selector: 'app-plato-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, DropdownModule, MultiSelectModule, InputSwitchModule, InputNumberModule, ToastModule, HasPermissionDirective],
    providers: [MessageService],
    template: `
        <div class="grid relative">
            <p-toast></p-toast>
            <!-- Left Panel: Platos Disponibles -->
            <div class="col-12 md:col-6 border-right-1 surface-border pr-5">
                <div class="flex justify-content-between align-items-center mb-3">
                    <button *appHasPermission="'CREATE_PLATO'" pButton label="Agregar Plato" icon="bi bi-plus-circle" class="p-button-outlined text-800 border-800 p-button-sm font-bold bg-white" style="border-radius: 4px;" (click)="openDialog()"></button>
                    <p-dropdown [options]="horariosFiltro" [(ngModel)]="filtroHorarioIzq" placeholder="Filtro" (onChange)="filterPlatos()" styleClass="w-8rem p-button-sm"></p-dropdown>
                </div>
                
                <p-table [value]="filteredPlatos" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-gridlines mt-3 border-1 surface-border">
                    <ng-template pTemplate="header">
                        <tr class="surface-100 text-700">
                            <th>Plato</th>
                            <th>Categoría</th>
                            <th>Costo</th>
                            <th>Horario</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-plato>
                        <tr>
                            <td>{{plato.nombreProducto}}</td>
                            <td>{{plato.nombreCategoria || 'Sin Categoría'}}</td>
                            <td>{{plato.precioVenta | currency:'/S ':'symbol'}}</td>
                            <td>{{plato.horarioDisponible}}</td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr><td colspan="4" class="text-center">No hay platos registrados.</td></tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- Right Panel: Platos Vendidos -->
            <div class="col-12 md:col-6 pl-5">
                <div class="flex justify-content-between align-items-center mb-3">
                    <h3 class="m-0 text-gray-700 font-normal text-xl mt-1">Plato vendido</h3>
                    <p-dropdown [options]="horariosFiltro" [(ngModel)]="filtroHorarioDer" placeholder="Filtro" (onChange)="filterSales()" styleClass="w-8rem p-button-sm"></p-dropdown>
                </div>
                
                <p-table [value]="filteredSales" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-gridlines mt-3 border-1 surface-border">
                    <ng-template pTemplate="header">
                        <tr class="surface-100 text-700">
                            <th>Plato</th>
                            <th>Categoría</th>
                            <th>Costo</th>
                            <th>Horario</th>
                            <th>Cantidad</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-sale>
                        <tr>
                            <td>{{sale.nombrePlato}}</td>
                            <td>{{sale.nombreCategoria || 'Sin Categoría'}}</td>
                            <td>{{sale.precioVenta | currency:'/S ':'symbol'}}</td>
                            <td>{{sale.horario}}</td>
                            <td><strong class="text-orange-600">{{sale.cantidadVendida}}</strong></td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr><td colspan="5" class="text-center">Aún no hay historial de ventas.</td></tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- Dialog for Nuevo Plato -->
        <p-dialog header="Registrar Nuevo Plato" [(visible)]="showDialog" [modal]="true" [style]="{width: '650px'}" [draggable]="false" appendTo="body">
            <div class="flex flex-column gap-4 p-3">
                <div>
                    <label class="font-bold block mb-2 text-lg">Nombre de la Comida <span class="text-red-500">*</span></label>
                    <input type="text" pInputText [(ngModel)]="platoForm.nombre" class="w-full text-xl p-3" placeholder="Ej: Ceviche mixto">
                </div>
                <div>
                    <label class="font-bold block mb-2 text-lg">Costo (Soles) <span class="text-red-500">*</span></label>
                    <p-inputNumber [(ngModel)]="platoForm.precio" mode="currency" currency="PEN" [min]="0" [showButtons]="true" class="w-full input-number-lg" inputId="currency-pen"></p-inputNumber>
                </div>
                <div>
                    <label class="font-bold block mb-2 text-lg">Categoría <span class="text-red-500">*</span></label>
                    <p-dropdown [options]="categorias" [(ngModel)]="platoForm.categoria" optionLabel="nombreCategoria" placeholder="Seleccione Categoría" [style]="{'width':'100%'}" class="w-full text-lg" appendTo="body" [filter]="true" filterBy="nombreCategoria"></p-dropdown>
                </div>
                <div>
                    <label class="font-bold block mb-2 text-lg">Horario Disponible <span class="text-red-500">*</span></label>
                    <p-multiSelect [options]="horarios" [(ngModel)]="platoForm.horarios" defaultLabel="Seleccione Horarios" optionLabel="label" optionValue="value" class="w-full multiselect-custom" display="chip" appendTo="body"></p-multiSelect>
                </div>
                <div>
                    <label class="font-bold block mb-2 text-lg">Fecha Disponible (Opcional)</label>
                    <input type="date" pInputText [(ngModel)]="platoForm.fecha" class="w-full text-lg p-3" title="Siempre disponible si está vacío">
                </div>
                <div class="flex align-items-center justify-content-between mt-3 surface-100 p-4 border-round-xl">
                    <label class="font-bold m-0 text-lg">Plato Activo</label>
                    <p-inputSwitch [(ngModel)]="platoForm.activo"></p-inputSwitch>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <button pButton label="Cancelar" icon="pi pi-times" class="p-button-text p-button-secondary" (click)="showDialog = false"></button>
                <button pButton label="Guardar Plato" icon="pi pi-check" class="p-button-success" (click)="savePlato()" [loading]="saving"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        .truncate {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `]
})
export class PlatoDashboardComponent implements OnInit {
    private productoService = inject(ProductoService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private categoriaService = inject(CategoriaService);

    platos: Producto[] = [];
    filteredPlatos: Producto[] = [];
    platoSales: PlatoSalesHistory[] = [];
    filteredSales: PlatoSalesHistory[] = [];
    categorias: Categoria[] = [];
    searchTerm: string = '';

    showDialog = false;
    saving = false;
    horarios = [
        { label: 'Mañana (6AM - 1PM)', value: 'Mañana' },
        { label: 'Tarde (1PM - 7PM)', value: 'Tarde' },
        { label: 'Noche (7PM - 6AM)', value: 'Noche' }
    ];

    horariosFiltro = [
        { label: 'Todos', value: null },
        { label: 'Mañana', value: 'Mañana' },
        { label: 'Tarde', value: 'Tarde' },
        { label: 'Noche', value: 'Noche' }
    ];

    filtroHorarioIzq: string | null = null;
    filtroHorarioDer: string | null = null;

    platoForm = {
        nombre: '',
        precio: 0,
        categoria: null as Categoria | null,
        horarios: [] as string[],
        fecha: null as string | null,
        activo: true
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        const sucursalId = this.authService.getSucursalId();
        if (!sucursalId) return;

        this.productoService.getPlatos(sucursalId).subscribe({
            next: (data) => {
                this.platos = data;
                this.filteredPlatos = [...this.platos];
            },
            error: (err) => console.error('Error loading platos', err)
        });

        this.categoriaService.getCategoriasBySucursal(sucursalId).subscribe({
            next: (data) => {
                this.categorias = data;
            },
            error: (err) => console.error('Error loading categorias', err)
        });

        this.productoService.getPlatosVentas(sucursalId).subscribe({
            next: (data) => {
                this.platoSales = data;
                this.filteredSales = [...this.platoSales];
            },
            error: (err) => console.error('Error loading plato sales', err)
        });
    }

    filterPlatos() {
        let temp = [...this.platos];
        if (this.filtroHorarioIzq) {
            temp = temp.filter(p => p.horarioDisponible?.includes(this.filtroHorarioIzq!));
        }
        this.filteredPlatos = temp;
    }

    filterSales() {
        if (!this.filtroHorarioDer) {
            this.filteredSales = [...this.platoSales];
        } else {
            this.filteredSales = this.platoSales.filter(s => s.horario === this.filtroHorarioDer);
        }
    }

    openDialog() {
        this.platoForm = { nombre: '', precio: 0, categoria: null, horarios: [], fecha: null, activo: true };
        this.showDialog = true;
    }

    savePlato() {
        if (!this.platoForm.nombre.trim() || this.platoForm.precio <= 0 || this.platoForm.horarios.length === 0 || !this.platoForm.categoria) {
            this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Por favor complete el nombre, precio, categoría y al menos un horario.' });
            return;
        }

        const sucursalId = this.authService.getSucursalId();
        const payload: any = {
            idProducto: null,
            nombreProducto: this.platoForm.nombre,
            precioVenta: this.platoForm.precio,
            costoCompra: 0,
            stock: 9999, // Platos do not have stock limits inherently
            sucursalId: sucursalId,
            estado: this.platoForm.activo,
            esPlato: true,
            horarioDisponible: this.platoForm.horarios.join(', '),
            fechaDisponible: this.platoForm.fecha ? this.platoForm.fecha : null,
            idCategoria: this.platoForm.categoria.idCategoria,
            idProveedor: null,
            tipo: 'PLATOS'
        };

        this.saving = true;
        this.productoService.createProducto(payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plato registrado correctamente' });
                this.showDialog = false;
                this.loadData();
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el plato. Revise que exista la categoría 1.' });
            },
            complete: () => this.saving = false
        });
    }
}
