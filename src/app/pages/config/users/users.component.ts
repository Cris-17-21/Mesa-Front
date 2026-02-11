import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user/user.service';
import { EmpresaService } from '../../../services/maestro/empresa.service'; // Ajusta la ruta
import { SucursalService } from '../../../services/maestro/sucursal.service'; // Ajusta la ruta
import { User } from '../../../models/security/user.model';
import { Role } from '../../../models/security/role.model';
import { Empresa } from '../../../models/maestro/empresa.model';
import { Sucursal } from '../../../models/maestro/sucursal.model';

import { ModalUsersComponent } from "./modal-users/modal-users.component";
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { RoleService } from '../../../services/config/role.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ModalUsersComponent, SelectModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private empresaService = inject(EmpresaService);
  private sucursalService = inject(SucursalService);

  // Datos para la tabla y modal
  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  empresas = signal<Empresa[]>([]);
  sucursales = signal<Sucursal[]>([]);
  selectedEmpresaId = signal<string | null>(null);
  selectedSucursalId = signal<string | null>(null);
  sucursalesFiltradas = signal<Sucursal[]>([]);

  // Estado del modal
  displayModal = signal(false);
  selectedUser = signal<User | null>(null);

  @ViewChild('dt2') table!: Table;

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    // Cargamos todo en paralelo para alimentar el modal y la tabla
    forkJoin({
      users: this.userService.getAllUsers(),
      roles: this.roleService.getAllRoles(),
      empresas: this.empresaService.getAllEmpresas(), // Ajusta según tus servicios
      sucursales: this.sucursalService.getAllSucursales()
    }).subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.roles.set(res.roles);
        this.empresas.set(res.empresas);
        this.sucursales.set(res.sucursales);
      },
      error: (err) => console.error('Error cargando datos:', err)
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe(data => this.users.set(data));
  }

  openCreate() {
    this.selectedUser.set(null);
    this.displayModal.set(true);
  }

  openEdit(user: User) {
    this.selectedUser.set(user);
    this.displayModal.set(true);
  }

  handleSaveUser(event: { data: any, isEdit: boolean }) {
    const { data, isEdit } = event;

    if (isEdit) {
      this.userService.updateUser(data, this.selectedUser()?.id!).subscribe({
        next: () => this.onSuccessSave('Usuario actualizado correctamente'),
        error: (err) => this.onErrorSave(err)
      });
    } else {
      this.userService.createUser(data).subscribe({
        next: () => this.onSuccessSave('Usuario creado correctamente'),
        error: (err) => this.onErrorSave(err)
      });
    }
  }

  onSuccessSave(msg: string) {
    Swal.fire('¡Éxito!', msg, 'success');
    this.displayModal.set(false);
    this.loadUsers();
  }

  onErrorSave(msg: any) {
    this.displayModal.set(false);
    console.log(msg)
    Swal.fire(msg.error.error, msg.error.message || 'Error al procesar la solicitud', 'error');
  }

  deleteUser(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará el usuario de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f54cc',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true, // Pone el botón de cancelar a la izquierda
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Llamada al servicio
        this.userService.deleteUser(id).subscribe({
          next: () => {
            // Opción A: Refrescar toda la tabla desde el servidor
            this.loadUsers();

            Swal.fire({
              title: '¡Eliminado!',
              text: 'El usuario ha sido borrado correctamente.',
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
              text: 'No se pudo eliminar el usuario. Es posible que esté en uso.',
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }

  applyFilters() {
    const empId = this.selectedEmpresaId();
    const sucId = this.selectedSucursalId();

    // 1. Si no hay nada seleccionado, volvemos al estado inicial (todos)
    if (!empId) {
      this.loadUsers();
      return;
    }

    // 2. Si hay Empresa pero NO hay Sucursal
    if (empId && !sucId) {
      this.userService.getUserByEmpresaId(empId).subscribe({
        next: (data) => this.users.set(data),
        error: (err) => console.log(err)
      });
      return; // Salimos para no ejecutar la siguiente lógica
    }

    // 3. Si están ambos (Empresa y Sucursal)
    if (empId && sucId) {
      this.userService.getUserByEmpresaIdAndSucursalId(empId, sucId).subscribe({
        next: (data) => this.users.set(data),
        error: (err) => console.log(err)
      });
    }
  }

  onEmpresaFilterChange(empId: string | null) {
    this.selectedEmpresaId.set(empId);
    this.selectedSucursalId.set(null); // Reset sucursal
    this.sucursalesFiltradas.set([]);

    if (empId) {
      this.sucursalService.getSucursalByEmpresaId(empId).subscribe({
        next: (data) => this.sucursalesFiltradas.set(data),
        error: () => this.sucursalesFiltradas.set([])
      });
    }
    this.applyFilters();
  }

  onSucursalFilterChange(sucId: string | null) {
    this.selectedSucursalId.set(sucId);
    this.applyFilters();
  }
}