import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProveedorService } from '../../../../services/compra/proveedor.service';
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';
import { Proveedor } from '../../../../models/compra/proveedor.model';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-modal-proveedor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, CardModule, ToastModule, RouterModule],
    providers: [MessageService],
    template: `
    <div class="card p-4" style="max-width: 600px; margin: 2rem auto;">
        <p-toast></p-toast>
        <h2>{{ isEditing ? 'Editar' : 'Nuevo' }} Proveedor</h2>
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-column gap-3">
            <!-- Campo RUC/DNI con botón de búsqueda -->
            <div class="field">
                <label for="ruc" class="block font-bold mb-2">RUC / DNI</label>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <input id="ruc" type="text" pInputText formControlName="ruc"
                           class="w-full"
                           placeholder="11 dígitos (RUC) o 8 dígitos (DNI)"
                           maxlength="11"/>
                    <button pButton type="button"
                            icon="pi pi-search"
                            class="p-button-outlined"
                            pTooltip="Buscar en SUNAT/RENIEC"
                            [loading]="buscando"
                            (click)="buscarDocumento()">
                    </button>
                </div>
                <small class="text-danger" *ngIf="form.get('ruc')?.invalid && form.get('ruc')?.touched">
                    Ingresa 8 dígitos (DNI) o 11 dígitos (RUC)
                </small>
            </div>

            <div class="field">
                <label for="razonSocial" class="block font-bold mb-2">Razón Social / Nombre</label>
                <input id="razonSocial" type="text" pInputText formControlName="razonSocial" class="w-full"/>
            </div>
            <div class="field">
                <label for="direccion" class="block font-bold mb-2">Dirección</label>
                <input id="direccion" type="text" pInputText formControlName="direccion" class="w-full"/>
            </div>
            <div class="field">
                <label for="telefono" class="block font-bold mb-2">Teléfono</label>
                <input id="telefono" type="text" pInputText formControlName="telefono" class="w-full"/>
            </div>
            <div class="field">
                <label for="correo" class="block font-bold mb-2">Correo</label>
                <input id="correo" type="email" pInputText formControlName="correo" class="w-full"/>
            </div>
            <div class="field">
                <label for="contacto" class="block font-bold mb-2">Contacto</label>
                <input id="contacto" type="text" pInputText formControlName="contacto" class="w-full"/>
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
export class ModalProveedorComponent implements OnInit {
    private fb = inject(FormBuilder);
    private proveedorService = inject(ProveedorService);
    private consultaService = inject(ConsultaService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    form: FormGroup;
    isEditing = false;
    currentId: number | null = null;
    buscando = false;

    constructor() {
        this.form = this.fb.group({
            ruc: ['', [Validators.required, Validators.pattern(/^\d{8}$|^\d{11}$/)]],
            razonSocial: ['', Validators.required],
            direccion: [''],
            telefono: [''],
            correo: ['', [Validators.email]],
            contacto: ['']
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditing = true;
            this.currentId = +id;
            this.loadProveedor(this.currentId);
        }
    }

    loadProveedor(id: number) {
        this.proveedorService.getProveedorById(id).subscribe({
            next: (data: Proveedor) => this.form.patchValue(data),
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el proveedor' });
                this.router.navigate(['/compras/proveedores']);
            }
        });
    }

    buscarDocumento() {
        const doc: string = (this.form.get('ruc')?.value || '').trim();

        if (doc.length === 11) {
            // Búsqueda por RUC en SUNAT
            this.buscando = true;
            this.consultaService.consultaRuc(doc).subscribe({
                next: (ruc) => {
                    this.form.patchValue({
                        razonSocial: ruc.razon_social,
                        direccion: ruc.direccion
                    });
                    this.messageService.add({ severity: 'success', summary: 'RUC encontrado', detail: ruc.razon_social });
                    this.buscando = false;
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'No encontrado', detail: 'No se encontró el RUC en SUNAT' });
                    this.buscando = false;
                }
            });
        } else if (doc.length === 8) {
            // Búsqueda por DNI en RENIEC
            this.buscando = true;
            this.consultaService.consultaDni(doc).subscribe({
                next: (dni) => {
                    this.form.patchValue({
                        razonSocial: dni.full_name
                    });
                    this.messageService.add({ severity: 'success', summary: 'DNI encontrado', detail: dni.full_name });
                    this.buscando = false;
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'No encontrado', detail: 'No se encontró el DNI en RENIEC' });
                    this.buscando = false;
                }
            });
        } else {
            this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Ingresa 8 dígitos (DNI) o 11 dígitos (RUC) antes de buscar' });
        }
    }

    onSubmit() {
        if (this.form.invalid) return;
        const data = this.form.value;

        if (this.isEditing && this.currentId) {
            this.proveedorService.updateProveedor(this.currentId, data).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor actualizado' });
                    setTimeout(() => this.router.navigate(['/compras/proveedores']), 1000);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar' })
            });
        } else {
            this.proveedorService.createProveedor(data).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor creado' });
                    setTimeout(() => this.router.navigate(['/compras/proveedores']), 1000);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear' })
            });
        }
    }

    onCancel() {
        this.router.navigate(['/compras/proveedores']);
    }
}
