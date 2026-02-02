import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ModalRolesComponent } from './modal-roles/modal-roles.component';
import { RoleService } from '../../../services/config/role.service';
import { Role } from '../../../models/security/role.model';

@Component({
  selector: 'app-roles',
  imports: [CommonModule, ButtonModule, TableModule, IconFieldModule, InputIconModule, MultiSelectModule, SelectModule, ModalRolesComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {

  private roleService = inject(RoleService);

  roles: Role[] = [];
  displayModal = signal(false);
  selectedRole = signal<Role | null>(null);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (data) => this.roles = data,
      error: (err) => console.error('Error', err)
    });
  }

  // MÉTODO PARA CREAR (Limpia el permiso seleccionado)
  openCreate() {
    this.selectedRole.set(null);
    this.displayModal.set(true);
  }

  // MÉTODO PARA EDITAR (Pasa el permiso de la fila)
  openEdit(role: Role) {
    this.selectedRole.set(role);
    this.displayModal.set(true);
  }

  deleteRole(id: string) {
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
        this.roleService.deleteRole(id).subscribe({
          next: () => {
            // Opción A: Refrescar toda la tabla desde el servidor
            this.loadRoles();

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
