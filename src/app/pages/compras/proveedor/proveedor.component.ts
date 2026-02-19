import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouterModule, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProveedorService } from '../../../services/compra/proveedor.service';
import { Proveedor } from '../../../models/compra/proveedor.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
    selector: 'app-proveedor',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, RouterModule, ConfirmDialogModule, ToastModule, HasPermissionDirective],
    providers: [ConfirmationService, MessageService],
    template: `
    <div class="card p-4">
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>
        
        <div class="flex justify-content-between align-items-center mb-4">
            <h2 class="m-0">Gestión de Proveedores</h2>
            <button *appHasPermission="'CREATE_PROVEEDOR'" pButton label="Nuevo Proveedor" icon="bi bi-plus" (click)="createProveedor()"></button>
        </div>

        <p-table [value]="proveedores" [tableStyle]="{ 'min-width': '50rem' }" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
                <tr>
                    <th>RUC</th>
                    <th>Razón Social</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Acciones</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-proveedor>
                <tr>
                    <td>{{ proveedor.ruc }}</td>
                    <td>{{ proveedor.razonSocial }}</td>
                    <td>{{ proveedor.telefono }}</td>
                    <td>{{ proveedor.direccion }}</td>                    
                    <td>
                        <button *appHasPermission="'UPDATE_PROVEEDOR'" pButton icon="bi bi-pencil" class="p-button-rounded p-button-text p-button-warning mr-2" (click)="editProveedor(proveedor.id)"></button>
                        <button *appHasPermission="'DELETE_PROVEEDOR'" pButton icon="bi bi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteProveedor(proveedor)"></button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="5">No hay proveedores registrados.</td></tr>
            </ng-template>
        </p-table>
    </div>
    `,
    styles: [`:host { display: block; }`]
})
export class ProveedorComponent implements OnInit {
    private proveedorService = inject(ProveedorService);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    proveedores: Proveedor[] = [];

    ngOnInit() {
        this.loadProveedores();
    }

    loadProveedores() {
        this.proveedorService.getAllProveedores().subscribe({
            next: (data) => this.proveedores = data,
            error: (err: any) => console.error('Error loading proveedores', err)
        });
    }

    createProveedor() {
        this.router.navigate(['/compras/proveedor/nuevo']);
    }

    editProveedor(id: number) {
        this.router.navigate(['/compras/proveedor/editar', id]);
    }

    deleteProveedor(proveedor: Proveedor) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar a ${proveedor.razonSocial}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.proveedorService.deleteProveedor(proveedor.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proveedor eliminado' });
                        this.loadProveedores();
                    },
                    error: (err: any) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el proveedor' });
                    }
                });
            }
        });
    }
}
