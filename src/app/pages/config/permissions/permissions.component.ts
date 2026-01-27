import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Permission } from '../../../models/security/permission.model';
import { PermissionService } from '../../../services/config/permission.service';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';
import { ModalPermissionsComponent } from './modal-permissions/modal-permissions.component';

@Component({
  selector: 'app-permissions',
  imports: [CommonModule, ButtonModule, TableModule, IconFieldModule, InputIconModule, MultiSelectModule, SelectModule, ModalPermissionsComponent],
  standalone: true,
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.css'
})
export class PermissionsComponent implements OnInit {

  private permissionService = inject(PermissionService);

  permissions: Permission[] = [];
  displayModal = signal(false);
  selectedPermission = signal<Permission | null>(null);

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (data) => this.permissions = data,
      error: (err) => console.error('Error', err)
    });
  }

  // MÉTODO PARA CREAR (Limpia el permiso seleccionado)
  openCreate() {
    this.selectedPermission.set(null);
    this.displayModal.set(true);
  }

  // MÉTODO PARA EDITAR (Pasa el permiso de la fila)
  openEdit(permission: Permission) {
    this.selectedPermission.set(permission);
    this.displayModal.set(true);
  }

  deletePermission(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará el permiso de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Color negro de tu estilo Noir
      cancelButtonColor: '#E67E22', // Rojo suave para cancelar
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true, // Pone el botón de cancelar a la izquierda
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Llamada al servicio
        this.permissionService.deletePermission(id).subscribe({
          next: () => {
            // Opción A: Refrescar toda la tabla desde el servidor
            this.loadPermissions();

            // Opción B (Más rápida): Filtrar el array localmente
            // this.permissions = this.permissions.filter(p => p.id !== id);

            Swal.fire({
              title: '¡Eliminado!',
              text: 'El permiso ha sido borrado correctamente.',
              icon: 'success',
              confirmButtonColor: '#18181b',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el permiso. Es posible que esté en uso.',
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }
}
