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

@Component({
    selector: 'app-plato-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, DropdownModule, MultiSelectModule, InputSwitchModule, InputNumberModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="grid relative">
            <p-toast></p-toast>
            <!-- Left Panel: Platos Disponibles -->
            <div class="col-12 md:col-6 border-right-1 surface-border pr-5">
                <div class="flex justify-content-between align-items-center mb-3">
                    <h3 class="m-0 text-primary">Platos Disponibles</h3>
                    <button pButton label="Nuevo Plato" icon="bi bi-plus-circle" class="p-button-sm p-button-success border-round-2xl" (click)="openDialog()"></button>
                </div>
                
                <span class="p-input-icon-left w-full mb-4">
                    <i class="bi bi-search"></i>
                    <input type="text" pInputText placeholder="Buscar Plato" class="w-full form-control" [(ngModel)]="searchTerm" (input)="filterPlatos()" />
                </span>

                <div class="grid">
                    <div class="col-12 md:col-6 lg:col-4" *ngFor="let plato of filteredPlatos">
                        <div class="card p-3 shadow-2 hover:shadow-4 transition-all transition-duration-200 cursor-pointer h-full border-round-xl border-1 surface-border flex flex-column">
                            <div class="text-xl font-bold text-gray-800 mb-2 truncate" [title]="plato.nombreProducto">{{ plato.nombreProducto }}</div>
                            <div class="text-green-600 font-semibold text-lg border-top-1 surface-border pt-2 mt-auto">
                                Costo {{ plato.precioVenta | currency:'/S ':'symbol' }}
                            </div>
                            <div class="text-sm text-500 mt-2 flex flex-wrap gap-1" *ngIf="plato.horarioDisponible">
                                <span class="bg-gray-100 px-2 py-1 border-round-lg text-xs" *ngFor="let hor of plato.horarioDisponible.split(',')">
                                    <i class="bi bi-clock"></i> {{ hor.trim() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div *ngIf="filteredPlatos.length === 0" class="text-center p-4 text-500">
                    No hay platos registrados o que coincidan con la búsqueda.
                </div>
            </div>

            <!-- Right Panel: Platos Vendidos -->
            <div class="col-12 md:col-6 pl-5">
                <h3 class="mt-0 mb-3 text-orange-500">Platos Vendidos</h3>
                
                <div class="flex flex-column gap-3">
                    <div *ngFor="let sales of platoSales" class="card p-3 shadow-1 border-round-xl surface-card flex justify-content-between align-items-center border-left-3 border-orange-500">
                        <div>
                            <div class="text-xl font-bold text-gray-800 mb-1 truncate" [style.maxWidth.px]="250" [title]="sales.nombrePlato">{{ sales.nombrePlato }}</div>
                            <div class="text-sm text-600 flex gap-2">
                                <span *ngIf="sales.cantidadVendidaManana > 0" class="bg-yellow-50 text-yellow-700 px-2 py-1 border-round-md"><i class="bi bi-brightness-alt-high"></i> Mañana: {{ sales.cantidadVendidaManana }}</span>
                                <span *ngIf="sales.cantidadVendidaTarde > 0" class="bg-orange-50 text-orange-700 px-2 py-1 border-round-md"><i class="bi bi-cloud-sun"></i> Tarde: {{ sales.cantidadVendidaTarde }}</span>
                                <span *ngIf="sales.cantidadVendidaNoche > 0" class="bg-indigo-50 text-indigo-700 px-2 py-1 border-round-md"><i class="bi bi-moon-stars"></i> Noche: {{ sales.cantidadVendidaNoche }}</span>
                            </div>
                        </div>
                        <div class="text-center ml-3">
                            <div class="text-sm text-500 mb-1 uppercase font-bold text-xs tracking-wider">Vendido</div>
                            <div class="text-2xl font-black text-orange-500 bg-orange-50 px-3 py-1 border-round-lg border-1 border-orange-200">
                                {{ sales.totalVendido }}
                            </div>
                        </div>
                    </div>
                </div>

                <div *ngIf="platoSales.length === 0" class="text-center p-4 text-500">
                    Aún no hay historial de ventas.
                </div>
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
    categorias: Categoria[] = [];
    searchTerm: string = '';

    showDialog = false;
    saving = false;
    horarios = [
        { label: 'Mañana (6AM - 1PM)', value: 'Mañana' },
        { label: 'Tarde (1PM - 7PM)', value: 'Tarde' },
        { label: 'Noche (7PM - 6AM)', value: 'Noche' }
    ];

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
        const empresaId = this.authService.getEmpresaId();
        if (!empresaId) return;

        this.productoService.getPlatos(empresaId).subscribe({
            next: (data) => {
                this.platos = data;
                this.filteredPlatos = [...this.platos];
            },
            error: (err) => console.error('Error loading platos', err)
        });

        this.categoriaService.getCategoriasByEmpresa(empresaId).subscribe({
            next: (data) => {
                this.categorias = data;
            },
            error: (err) => console.error('Error loading categorias', err)
        });

        this.productoService.getPlatosVentas(empresaId).subscribe({
            next: (data) => {
                this.platoSales = data;
            },
            error: (err) => console.error('Error loading plato sales', err)
        });
    }

    filterPlatos() {
        if (!this.searchTerm.trim()) {
            this.filteredPlatos = [...this.platos];
            return;
        }
        const term = this.searchTerm.toLowerCase();
        this.filteredPlatos = this.platos.filter(p => p.nombreProducto.toLowerCase().includes(term));
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

        const empresaId = this.authService.getEmpresaId();
        const payload: any = {
            idProducto: null,
            nombreProducto: this.platoForm.nombre,
            precioVenta: this.platoForm.precio,
            costoCompra: 0,
            stock: 9999, // Platos do not have stock limits inherently
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
