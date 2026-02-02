import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user/user.service';
import { EmpresaService } from '../../../services/maestro/empresa.service'; // Ajusta la ruta
import { SucursalService } from '../../../services/maestro/sucursal.service'; // Ajusta la ruta
import { User } from '../../../models/security/user.model';
import { Role } from '../../../models/security/role.model';
import { Empresa } from '../../../models/maestro/empresa.model';
import { Sucursal } from '../../../models/maestro/sucursal.model';

import { ModalUsersComponent } from "./modal-users/modal-users.component";
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { RoleService } from '../../../services/config/role.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ModalUsersComponent],
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

  // Estado del modal
  displayModal = signal(false);
  selectedUser = signal<User | null>(null);

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
        next: () => this.onSuccessSave('Usuario actualizado'),
        error: () => this.onErrorSave()
      });
    } else {
      this.userService.createUser(data).subscribe({
        next: () => this.onSuccessSave('Usuario creado'),
        error: () => this.onErrorSave()
      });
    }
  }

  onSuccessSave(msg: string) {
    Swal.fire('¡Éxito!', msg, 'success');
    this.displayModal.set(false);
    this.loadUsers();
  }

  onErrorSave() {
    Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
  }

  deleteUser(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#18181b',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.loadUsers();
            Swal.fire('Eliminado', 'Usuario borrado correctamente', 'success');
          }
        });
      }
    });
  }
}