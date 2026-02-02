import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { EmpresaService } from '../../../services/maestro/empresa.service';
import { Empresa } from '../../../models/maestro/empresa.model';
import { ModalEmpresaComponent } from './modal-empresa/modal-empresa.component';
import { SucursalService } from '../../../services/maestro/sucursal.service';
import { UserService } from '../../../services/user/user.service';
import { concatMap } from 'rxjs';
import { CreateUserDto } from '../../../models/security/user.model';

@Component({
  selector: 'app-empresa',
  imports: [CommonModule, TableModule, IconFieldModule, InputIconModule, MultiSelectModule, SelectModule, ModalEmpresaComponent],
  templateUrl: './empresa.component.html',
  styleUrl: './empresa.component.css'
})
export class EmpresaComponent implements OnInit {

  private empresaService = inject(EmpresaService);
  private sucursalService = inject(SucursalService);
  private userService = inject(UserService);

  empresas: Empresa[] = [];
  displayModal = signal(false);
  selectedEmpresa = signal<Empresa | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (data) => this.empresas = data,
      error: (err) => console.error('Error', err)
    });
  }

  // MÉTODO PARA CREAR (Limpia el permiso seleccionado)
  openCreate() {
    this.selectedEmpresa.set(null);
    this.displayModal.set(true);
  }

  // MÉTODO PARA EDITAR (Pasa el permiso de la fila)
  openEdit(empresa: Empresa) {
    this.selectedEmpresa.set(empresa);
    this.displayModal.set(true);
  }

  handleSave(wizardData: any) {
    const { data, isEdit } = wizardData;

    if (isEdit) {
      this.empresaService.updateEmpresa(data, data.id).subscribe({
        next: () => {
          this.successMessage('Empresa actualizada');
          this.loadEmpresas();
          this.displayModal.set(false);
        },
        error: (err) => this.errorMessage('Error al actualizar empresa')
      });
    } else {
      this.loading.set(true);

      // 1. Crear Empresa
      this.empresaService.createEmpresa(data.empresa).pipe(
        concatMap((empresaCreada) => {
          // IMPORTANTE: El DTO de Sucursal espera 'empresaId' como String/UUID
          const sucursalPayload = {
            ...data.sucursal,
            empresaId: empresaCreada.id // Cambiado de 'empresa: empresaCreada'
          };

          // 2. Crear Sucursal
          return this.sucursalService.createSucursal(sucursalPayload).pipe(
            concatMap((sucursalCreada) => {
              // 3. Crear Usuario vinculado
              const { roleId, ...userData } = data.usuario;

              const usuarioPayload: CreateUserDto = {
                username: userData.username,
                password: userData.password,
                nombres: userData.nombres,
                apellidoPaterno: userData.apellidoPaterno,
                apellidoMaterno: userData.apellidoMaterno,
                tipoDocumento: userData.tipoDocumento,
                numeroDocumento: userData.numeroDocumento,
                telefono: userData.telefono,
                direccion: userData.direccion || 'Dirección no especificada', // Evita nulos si es obligatorio
                email: userData.email,
                // ASIGNACIÓN EXPLÍCITA DE IDs
                role: roleId,
                empresaId: empresaCreada.id,
                sucursalId: sucursalCreada.id
              };
              return this.userService.createUser(usuarioPayload);
            })
          );
        })
      ).subscribe({
        next: () => {
          this.successMessage('Restaurante y Administrador creados con éxito');
          this.loadEmpresas();
          this.displayModal.set(false);
        },
        error: (err) => {
          console.error('Error en el flujo:', err);
          // El error 400 "id must not be null" venía de enviar el objeto empresa en lugar del ID
          this.errorMessage('Error en el registro: Verifique que los datos sean correctos');
        },
        complete: () => this.loading.set(false)
      });
    }
  }

  deleteEmpresa(id: string) {
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
        this.empresaService.deleteEmpresa(id).subscribe({
          next: () => {
            // Opción A: Refrescar toda la tabla desde el servidor
            this.loadEmpresas();

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

  private successMessage(msg: string) {
    Swal.fire({ title: '¡Éxito!', text: msg, icon: 'success', confirmButtonColor: '#18181b' });
  }

  private errorMessage(msg: string) {
    Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#18181b' });
  }
}
