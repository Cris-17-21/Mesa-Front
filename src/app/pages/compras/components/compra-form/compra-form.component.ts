import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CompraService, PedidoCompraDto, TiposPagoDto } from '../../../../services/compra/compra.service';
import { ProveedorService } from '../../../../services/compra/proveedor.service';
import { ProductoService } from '../../../../services/inventario/producto.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Proveedor } from '../../../../models/compra/proveedor.model';
import { Producto } from '../../../../models/inventario/producto.model';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-compra-form',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
        InputTextModule, InputNumberModule, ButtonModule,
        TextareaModule, ToastModule, InputSwitchModule
    ],
    styles: [`
        .compra-page { max-width: 780px; margin: 0 auto; padding: 2rem 1rem; }
        .compra-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
        .compra-header h2 { margin:0; font-size:1.5rem; }
        .btn-cancel-header { background:none; border:none; font-size:1.6rem; cursor:pointer; color:#6c757d; }
        .seccion-card { background:#fff; border:1px solid #dee2e6; border-radius:10px; padding:1.5rem; margin-bottom:1.5rem; }
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
        .campo-input[readonly] { background:#f8f9fa; color:#6c757d; }
        textarea.campo-input { resize:vertical; }
        .proveedor-wrapper { position:relative; }
        .proveedor-dropdown { position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #dee2e6; border-radius:6px; z-index:9999; max-height:220px; overflow-y:auto; box-shadow:0 4px 12px rgba(0,0,0,.1); }
        .prov-item { padding:.75rem 1rem; cursor:pointer; border-bottom:1px solid #f0f0f0; }
        .prov-item:hover { background:#f8f9fa; }
        .prov-item strong { display:block; font-size:.9rem; }
        .prov-item small { display:block; font-size:.78rem; color:#6c757d; margin-top:2px; }
        .btn-clear { position:absolute; right:.5rem; top:50%; transform:translateY(-50%); background:none; border:none; font-size:1.1rem; cursor:pointer; color:#6c757d; }
        .detalle-row { background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px; padding:1rem; margin-bottom:.75rem; }
        .detalle-grid { display:grid; grid-template-columns:2fr 80px 120px 120px 44px; gap:.75rem; align-items:end; }
        .detalle-producto {}
        .detalle-cant { }
        .detalle-precio { }
        .detalle-sub { }
        .detalle-del { }
        .subtotal-readonly { background:#e9ecef; font-weight:600; color:#2c3e50; }
        .btn-eliminar { background:#c0392b; color:#fff; border:none; border-radius:6px; width:38px; height:38px; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .btn-eliminar:hover { background:#a93226; }
        .btn-agregar-producto { background:#fff; border:1px dashed #adb5bd; border-radius:6px; padding:.6rem 1.2rem; cursor:pointer; font-size:.9rem; color:#495057; margin-top:.5rem; }
        .btn-agregar-producto:hover { background:#f8f9fa; border-color:#6c757d; }
        .igv-row { margin-top:1.25rem; padding:1rem 1.25rem; background:#f0f4ff; border-radius:8px; }
        .switch-label { display:flex; align-items:center; gap:1rem; cursor:pointer; }
        .toggle-track { width:44px; height:24px; border-radius:12px; background:#ccc; position:relative; transition:.2s; flex-shrink:0; }
        .toggle-track.on { background:#6c63ff; }
        .toggle-thumb { width:20px; height:20px; background:#fff; border-radius:50%; position:absolute; top:2px; left:2px; transition:.2s; }
        .toggle-track.on .toggle-thumb { left:22px; }
        .igv-hint { font-size:.78rem; color:#6c757d; }
        .totales-section { margin-top:1.25rem; }
        .total-row { display:flex; justify-content:space-between; padding:.35rem 0; font-size:.95rem; }
        .total-row hr { border:none; border-top:1px solid #dee2e6; margin:.5rem 0; }
        .total-final { font-size:1.1rem; }
        .acciones-footer { display:flex; justify-content:flex-end; gap:1rem; margin-top:.5rem; }
        .btn-sec { background:#fff; border:1px solid #dee2e6; border-radius:6px; padding:.6rem 1.5rem; cursor:pointer; font-size:.9rem; }
        .btn-primary { background:#c0392b; color:#fff; border:none; border-radius:6px; padding:.6rem 1.5rem; cursor:pointer; font-size:.9rem; font-weight:600; }
        .btn-primary:hover { background:#a93226; }
        .btn-primary:disabled { background:#aaa; cursor:not-allowed; }
        .overlay-transparent { position:fixed; inset:0; z-index:9998; }
    `],
    providers: [MessageService],
    templateUrl: './compra-form.component.html'
})
export class CompraFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private compraService = inject(CompraService);
    private proveedorService = inject(ProveedorService);
    private productoService = inject(ProductoService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    form: FormGroup;
    proveedores: Proveedor[] = [];
    proveedoresFiltrados: Proveedor[] = [];
    productos: Producto[] = [];
    tiposPago: TiposPagoDto[] = [];

    proveedorBusqueda = '';
    showProveedorList = false;
    selectedProveedor: Proveedor | null = null;

    aplicaIgv = true;
    enviando = false;
    today = new Date().toISOString().split('T')[0];

    constructor() {
        this.form = this.fb.group({
            fechaEntregaEsperada: [null],
            idTipoPago: [null],
            referencia: [''],
            observaciones: [''],
            detalles: this.fb.array([])
        });
    }

    ngOnInit() {
        const empresaId = this.authService.getClaim('empresaId');
        this.proveedorService.getAllProveedores().subscribe(data => {
            this.proveedores = data;
            this.proveedoresFiltrados = data;
        });
        if (empresaId) {
            this.productoService.getProductoByEmpresaId(empresaId).subscribe(data => {
                this.productos = data;
            });
        }
        this.compraService.getTiposPago().subscribe(data => {
            this.tiposPago = data;
        });
    }

    // --- Proveedor Search ---
    filtrarProveedores() {
        const q = this.proveedorBusqueda.toLowerCase();
        this.proveedoresFiltrados = this.proveedores.filter(p =>
            p.razonSocial?.toLowerCase().includes(q) ||
            p.ruc?.includes(q)
        );
        this.showProveedorList = true;
    }

    seleccionarProveedor(p: Proveedor) {
        this.selectedProveedor = p;
        this.proveedorBusqueda = p.razonSocial;
        this.showProveedorList = false;
    }

    limpiarProveedor() {
        this.selectedProveedor = null;
        this.proveedorBusqueda = '';
    }

    // --- Detalles FormArray ---
    get detalles(): FormArray {
        return this.form.get('detalles') as FormArray;
    }

    agregarProducto() {
        const row = this.fb.group({
            idProducto: [null, Validators.required],
            cantidadPedida: [1, [Validators.required, Validators.min(1)]],
            costoUnitario: [0, [Validators.required, Validators.min(0)]],
            subtotalLinea: [0]
        });

        row.valueChanges.subscribe(v => {
            const sub = (v.cantidadPedida || 0) * (v.costoUnitario || 0);
            if (v.subtotalLinea !== sub) {
                row.patchValue({ subtotalLinea: sub }, { emitEvent: false });
            }
        });

        this.detalles.push(row);
    }

    onProductoChange(i: number) {
        const ctrl = this.detalles.at(i);
        const prod = this.productos.find(p => p.idProducto === ctrl.get('idProducto')?.value);
        if (prod?.costoCompra) {
            ctrl.patchValue({ costoUnitario: prod.costoCompra });
        }
    }

    quitarProducto(i: number) {
        this.detalles.removeAt(i);
    }

    getNombreProducto(i: number): string {
        const id = this.detalles.at(i).get('idProducto')?.value;
        return this.productos.find(p => p.idProducto === id)?.nombreProducto || '';
    }

    // --- Totals ---
    get subtotal(): number {
        return this.detalles.controls.reduce((acc, c) => acc + (c.get('subtotalLinea')?.value || 0), 0);
    }

    get igvAmount(): number {
        return this.aplicaIgv ? +(this.subtotal * 0.18).toFixed(2) : 0;
    }

    get total(): number {
        return +(this.subtotal + this.igvAmount).toFixed(2);
    }

    // --- Submit ---
    onSubmit() {
        if (!this.selectedProveedor) {
            this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona un proveedor' });
            return;
        }
        if (this.detalles.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Agrega al menos un producto' });
            return;
        }

        const v = this.form.value;
        const dto: PedidoCompraDto = {
            idProveedor: this.selectedProveedor.idProveedor,
            fechaEntregaEsperada: v.fechaEntregaEsperada
                ? this.formatDate(v.fechaEntregaEsperada)
                : null,
            idTipoPago: v.idTipoPago || null,
            referencia: v.referencia,
            observaciones: v.observaciones,
            aplicaIgv: this.aplicaIgv,
            totalPedido: this.total,
            detalles: v.detalles
        };

        this.enviando = true;
        this.compraService.create(dto).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: '¡Compra registrada!', detail: 'El pedido fue enviado correctamente.' });
                setTimeout(() => this.router.navigate(['/compras']), 1500);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la compra' });
                this.enviando = false;
            }
        });
    }

    private formatDate(d: Date | string): string {
        if (typeof d === 'string') return d;
        return d.toISOString().split('T')[0];
    }

    onCancel() {
        this.router.navigate(['/compras']);
    }
}
