import { Component, inject, signal, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

// Servicios y Modelos
import { UserService } from '../../../services/user/user.service';
import { RoleService } from '../../../services/config/role.service';
import { EmpresaService } from '../../../services/maestro/empresa.service';
import { SucursalService } from '../../../services/maestro/sucursal.service';
import { User } from '../../../models/security/user.model';
import { Role } from '../../../models/security/role.model';
import { Empresa } from '../../../models/maestro/empresa.model';
import { Sucursal } from '../../../models/maestro/sucursal.model';

// Componentes
import { ModalUsersComponent } from "./modal-users/modal-users.component";

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ModalUsersComponent, SelectModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  // Inyección de servicios
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly empresaService = inject(EmpresaService);
  private readonly sucursalService = inject(SucursalService);

  // Datos para la tabla y modal
  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly empresas = signal<Empresa[]>([]);
  readonly sucursales = signal<Sucursal[]>([]);
  readonly selectedEmpresaId = signal<string | null>(null);
  readonly selectedSucursalId = signal<string | null>(null);
  readonly sucursalesFiltradas = signal<Sucursal[]>([]);

  // Estado del modal y UI
  readonly displayModal = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly loading = signal(false);

  @ViewChild('dt2') table!: Table;

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    // Cargamos todo en paralelo para alimentar el modal y la tabla
    forkJoin({
      users: this.userService.getAllActiveUsers(),
      roles: this.roleService.getAllRoles(),
      empresas: this.empresaService.getAllActiveEmpresas(),
      sucursales: this.sucursalService.getAllActiveSucursales()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.users.set(res.users);
          this.roles.set(res.roles);
          this.empresas.set(res.empresas);
          this.sucursales.set(res.sucursales);
        },
        error: (err) => this.errorMessage('Error cargando datos iniciales', err)
      });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAllActiveUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.users.set(data),
        error: (err) => this.errorMessage('Error al cargar usuarios', err)
      });
  }

  openCreate(): void {
    this.selectedUser.set(null);
    this.displayModal.set(true);
  }

  openEdit(user: User): void {
    this.loading.set(true);
    this.userService.getOptionalUser(user.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (fullUser) => {
          this.selectedUser.set(fullUser);
          this.displayModal.set(true);
        },
        error: (err) => this.errorMessage('Error al obtener detalles del usuario', err)
      });
  }

  handleSaveUser(event: { data: any, isEdit: boolean }): void {
    const { data, isEdit } = event;
    this.loading.set(true);

    const request = isEdit
      ? this.userService.updateUser(data, this.selectedUser()?.id!)
      : this.userService.createUser(data);

    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage(isEdit ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
          this.displayModal.set(false);
          this.loadUsers();
        },
        error: (err) => this.errorMessage(isEdit ? 'Error al actualizar usuario' : 'Error al crear usuario', err)
      });
  }

  deleteUser(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará el usuario de forma permanente y sus datos relacionados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#e4e4e7',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading.set(true);
        this.userService.deleteUser(id)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.successMessage('El usuario ha sido borrado correctamente.');
              this.loadUsers();
            },
            error: (err) => this.errorMessage('No se pudo eliminar el usuario. Es posible que esté en uso.', err)
          });
      }
    });
  }

  applyFilters(): void {
    const empId = this.selectedEmpresaId();
    const sucId = this.selectedSucursalId();

    if (!empId) {
      this.loadUsers();
      return;
    }

    this.loading.set(true);
    const request = (!sucId)
      ? this.userService.getUserByEmpresaId(empId)
      : this.userService.getUserByEmpresaIdAndSucursalId(empId, sucId);

    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.users.set(data),
        error: (err) => this.errorMessage('Error al filtrar usuarios', err)
      });
  }

  onEmpresaFilterChange(empId: string | null): void {
    this.selectedEmpresaId.set(empId);
    this.selectedSucursalId.set(null);
    this.sucursalesFiltradas.set([]);

    if (empId) {
      this.sucursalService.getSucursalByEmpresaId(empId).subscribe({
        next: (data) => this.sucursalesFiltradas.set(data),
        error: () => this.sucursalesFiltradas.set([])
      });
    }
    this.applyFilters();
  }

  onSucursalFilterChange(sucId: string | null): void {
    this.selectedSucursalId.set(sucId);
    this.applyFilters();
  }

  // --- MÉTODOS DE UI (Siguiendo el patrón de EmpresaComponent) ---

  private successMessage(msg: string): void {
    Swal.fire({
      title: '¡Éxito!',
      text: msg,
      icon: 'success',
      confirmButtonColor: '#18181b',
      timer: 1500,
      showConfirmButton: false
    });
  }

  private errorMessage(contextMessage: string, err?: HttpErrorResponse | any): void {
    const serverTitle = err?.error?.error || 'Error';
    const serverMessage = err?.error?.message || contextMessage;

    Swal.fire({
      title: serverTitle,
      text: serverMessage,
      icon: 'error',
      confirmButtonColor: '#18181b'
    });
  }
}