import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CompraService } from '../../services/compra.service';
import { DetalleCompra } from '../../models/detalle-compra.model';
import { Compra } from '../../models/compra.model';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-compra-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        InputTextModule,
        InputNumberModule,
        ButtonModule,
        TableModule,
        CalendarModule,
        DropdownModule,
        CardModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './compra-form.component.html'
})
export class CompraFormComponent {
    private fb = inject(FormBuilder);
    private compraService = inject(CompraService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    compraForm: FormGroup;

    // Mock products for the dropdown
    productos = [
        { label: 'Aceite 1L', value: 10, precio: 8.50 },
        { label: 'Arroz 5kg', value: 20, precio: 22.00 },
        { label: 'Gaseosa 3L', value: 30, precio: 12.00 }
    ];

    // Mock providers
    proveedores = [
        { label: 'Distribuidora Alimentos SAC', value: 101 },
        { label: 'Bebidas del Norte', value: 102 }
    ];

    constructor() {
        this.compraForm = this.fb.group({
            proveedorId: [null, Validators.required],
            nroComprobante: ['', Validators.required],
            fecha: [new Date(), Validators.required],
            estado: ['PENDIENTE', Validators.required],
            detalles: this.fb.array([])
        });

        // Add initial row
        this.addDetalle();
    }

    get detalles(): FormArray {
        return this.compraForm.get('detalles') as FormArray;
    }

    addDetalle() {
        const detalleGroup = this.fb.group({
            productoId: [null, Validators.required],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            precioUnitario: [0, [Validators.required, Validators.min(0)]],
            subtotal: [0]
        });

        // Update subtotal when quantity or price changes
        detalleGroup.valueChanges.subscribe(val => {
            if (val.cantidad && val.precioUnitario) {
                const sub = val.cantidad * val.precioUnitario;
                if (val.subtotal !== sub) {
                    detalleGroup.patchValue({ subtotal: sub }, { emitEvent: false });
                }
            }
        });

        this.detalles.push(detalleGroup);
    }

    removeDetalle(index: number) {
        this.detalles.removeAt(index);
        if (this.detalles.length === 0) {
            this.addDetalle();
        }
    }

    calculateTotal(): number {
        return this.detalles.controls.reduce((acc, curr) => acc + (curr.get('subtotal')?.value || 0), 0);
    }

    onSubmit() {
        if (this.compraForm.invalid) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor complete todos los campos requeridos.' });
            return;
        }

        const formValue = this.compraForm.getRawValue();

        // Prepare object for API
        const compra: Compra = {
            proveedorId: formValue.proveedorId,
            nroComprobante: formValue.nroComprobante,
            fecha: formValue.fecha instanceof Date ? formValue.fecha.toISOString() : formValue.fecha,
            estado: formValue.estado,
            total: this.calculateTotal(),
            detalles: formValue.detalles.map((d: any) => ({
                productoId: d.productoId,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                subtotal: d.subtotal
            }))
        };

        // Lookup provider name for mock display
        const prov = this.proveedores.find(p => p.value === compra.proveedorId);
        if (prov) compra.proveedorNombre = prov.label;

        this.compraService.createCompra(compra).subscribe({
            next: (res) => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Compra registrada correctamente' });
                setTimeout(() => this.router.navigate(['/compras']), 1500);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la compra' });
            }
        });
    }

    onCancel() {
        this.router.navigate(['/compras']);
    }
}
