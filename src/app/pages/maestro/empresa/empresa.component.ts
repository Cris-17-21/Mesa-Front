import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

// Módulos de PrimeNG
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

// Modelos y Servicios
import { EmpresaService } from '../../../services/maestro/empresa.service';
import { Empresa } from '../../../models/maestro/empresa.model';
import { UserAcessService } from '../../../services/maestro/user-acess.service';
import { CreateCompleteRestaurantDto } from '../../../models/maestro/userAccess.model';

// Componentes
import { ModalEmpresaComponent } from './modal-empresa/modal-empresa.component';

export interface EmpresaWizardData {
  isEdit: boolean;
  data: any;
}

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, TableModule, IconFieldModule, InputIconModule, MultiSelectModule, SelectModule, ModalEmpresaComponent],
  templateUrl: './empresa.component.html',
  styleUrl: './empresa.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmpresaComponent implements OnInit {

  // Inyección de servicios
  private readonly empresaService = inject(EmpresaService);
  private readonly userAccessService = inject(UserAcessService);

  readonly empresas = signal<Empresa[]>([]);
  readonly displayModal = signal(false);
  readonly selectedEmpresa = signal<Empresa | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.empresaService.getAllEmpresas().subscribe({
      next: (data) => this.empresas.set(data), // Actualizamos el signal
      error: (err) => this.errorMessage('No se pudo cargar las empresas', err)
    });
  }

  openCreate(): void {
    this.selectedEmpresa.set(null);
    this.displayModal.set(true);
  }

  openEdit(empresa: Empresa): void {
    this.selectedEmpresa.set(empresa);
    this.displayModal.set(true);
  }

  handleSave(wizardData: EmpresaWizardData): void {
    const { data, isEdit } = wizardData;
    this.loading.set(true);

    if (isEdit) {
      this.empresaService.updateEmpresa(data, data.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.successMessage('Empresa actualizada');
            this.loadEmpresas();
            this.displayModal.set(false);
          },
          error: (err) => this.errorMessage('Error al actualizar', err)
        });
    } else {
      const { roleId, ...userData } = data.user;

      const payload: CreateCompleteRestaurantDto = {
        empresa: data.empresa,
        sucursal: data.sucursal,
        user: {
          ...userData,
          role: roleId,
          direccion: userData.direccion || 'Dirección no especificada'
        }
      };

      this.userAccessService.registerCompleteRestaurant(payload)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.successMessage('Restaurante, Sucursal y Administrador creados con éxito');
            this.loadEmpresas();
            this.displayModal.set(false);
          },
          error: (err) => this.errorMessage('Error al registrar la empresa', err)
        });
    }
  }

  deleteEmpresa(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará la empresa de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f54cc',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.empresaService.deleteEmpresa(id).subscribe({
          next: () => {
            this.loadEmpresas();
            Swal.fire({
              title: '¡Eliminado!',
              text: 'La empresa ha sido borrada correctamente.',
              icon: 'success',
              confirmButtonColor: '#18181b',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => this.errorMessage('No se pudo eliminar la empresa. Es posible que esté en uso.', err)
        });
      }
    });
  }

  // --- MÉTODOS PRIVADOS DE UI ---

  private successMessage(msg: string): void {
    Swal.fire({ title: '¡Éxito!', text: msg, icon: 'success', confirmButtonColor: '#18181b' });
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
