import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProveedorService } from '../../../../services/compra/proveedor.service';
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';
import { AuthService } from '../../../../core/auth/auth.service';
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
        
        <div class="seccion-card">
            <div class="seccion-titulo">
                <!--<span class="icono">🤝</span>-->
                <h3>{{ isEditing ? 'Editar' : 'Nuevo' }} Proveedor</h3>
            </div>
            <hr class="linea-roja" />
            
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
                <!-- Campo RUC/DNI con botón de búsqueda -->
                <div class="field col-full">
                    <label for="ruc">RUC / DNI *</label>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <input id="ruc" type="text" formControlName="ruc"
                               class="campo-input"
                               placeholder="11 dígitos (RUC) o 8 dígitos (DNI)"
                               maxlength="11"/>
                        <button pButton type="button"
                                icon="bi bi-search"
                                class="p-button-outlined btn-buscar"
                                pTooltip="Buscar en SUNAT/RENIEC"
                                [loading]="buscando"
                                (click)="buscarDocumento()">
                        </button>
                    </div>
                    <small class="text-danger" *ngIf="form.get('ruc')?.invalid && form.get('ruc')?.touched">
                        Ingresa 8 dígitos (DNI) o 11 dígitos (RUC)
                    </small>
                </div>

                <div class="field col-full">
                    <label for="razonSocial">Razón Social / Nombre *</label>
                    <input id="razonSocial" type="text" class="campo-input" formControlName="razonSocial"/>
                </div>
                <div class="field col-full">
                    <label for="direccion">Dirección</label>
                    <input id="direccion" type="text" class="campo-input" formControlName="direccion"/>
                </div>
                <div class="field col-full">
                    <label for="telefono">Teléfono</label>
                    <input id="telefono" type="text" class="campo-input" formControlName="telefono"/>
                </div>
                <div class="field col-full">
                    <label for="correo">Correo</label>
                    <input id="correo" type="email" class="campo-input" formControlName="correo"/>
                </div>

                <!-- Espaciador para alinear el grid de botones abajo a la derecha -->
                <div class="col-full" style="display:flex;justify-content:flex-end;gap:.8rem;margin-top:1rem;">
                    <button type="button" class="btn-cancel" (click)="onCancel()">Cancelar</button>
                    <button type="submit" class="btn-save" [disabled]="form.invalid">{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
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
        .form-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
        .field { display:flex; flex-direction:column; gap:.3rem; }
        .field label { font-weight:600; font-size:.85rem; color:#495057; }
        .col-full { grid-column: 1 / -1; }
        .campo-input { border:1px solid #ced4da; border-radius:6px; padding:.5rem .75rem; font-size:.9rem; width:100%; box-sizing:border-box; }
        .campo-input:focus { outline:none; border-color:#c0392b; box-shadow:0 0 0 2px rgba(192,57,43,.15); }
        .btn-cancel { padding:.5rem 1.5rem; border-radius:6px; border:1px solid #6c757d; background:#fff; color:#6c757d; cursor:pointer; }
        .btn-save { padding:.5rem 1.5rem; border-radius:6px; border:none; background:#3b82f6; color:#fff; cursor:pointer; font-weight:600; }
        .btn-save:hover:not(:disabled) { background:#2563eb; }
        .btn-save:disabled { background:#9ca3af; cursor:not-allowed; }
        .btn-buscar { height: 38px; border-radius: 6px; }
        .text-danger { color: #dc3545; font-size: 0.8rem; margin-top: 0.2rem; }
    `]
})
export class ModalProveedorComponent implements OnInit {
    private fb = inject(FormBuilder);
    private proveedorService = inject(ProveedorService);
    private consultaService = inject(ConsultaService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);

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
            correo: ['', [Validators.email]]
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
        data.empresaId = this.authService.getEmpresaId();

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
