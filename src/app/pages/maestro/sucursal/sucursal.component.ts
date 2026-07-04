import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';

// Servicios y Modelos
import { SucursalService } from '../../../services/maestro/sucursal.service';
import { Sucursal } from '../../../models/maestro/sucursal.model';
import { EmpresaService } from '../../../services/maestro/empresa.service';
import { Empresa } from '../../../models/maestro/empresa.model';

// Componente Modal y su Interfaz
import { ModalSucursalComponent, SucursalModalData } from './modal-sucursal/modal-sucursal.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sucursal',
  standalone: true,
  imports: [
    CommonModule, TableModule, IconFieldModule, InputIconModule, MultiSelectModule,
    SelectModule, ModalSucursalComponent, FormsModule
  ],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent implements OnInit {

  private readonly sucursalService = inject(SucursalService);
  private readonly empresaService = inject(EmpresaService);
  private readonly authService = inject(AuthService);

  readonly isSuperAdmin = this.authService.isSuperAdmin;

  readonly allSucursales = signal<Sucursal[]>([]);
  readonly empresas = signal<Empresa[]>([]);
  readonly selectedSucursal = signal<Sucursal | null>(null);
  readonly selectedEmpresaId = signal<string | null>(null);

  readonly filteredSucursales = computed(() => {
    const list = this.allSucursales();
    const empId = this.selectedEmpresaId();
    if (!empId) return list;
    return list.filter(s => {
      const companyId = typeof s.empresa === 'string' ? s.empresa : (s.empresa as any)?.id;
      return companyId === empId;
    });
  });

  readonly displayModal = signal(false);
  readonly loading = signal(false); // Para la tabla
  readonly isSaving = signal(false); // Para el botón del modal

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading.set(true);
    if (this.isSuperAdmin()) {
      this.empresaService.getAllActiveEmpresas().subscribe({
        next: (data) => this.empresas.set(data),
        error: () => {}
      });
    } else {
      const empresaId = this.authService.getEmpresaId();
      this.selectedEmpresaId.set(empresaId);
    }
    this.loadAllSucursales();
  }

  loadAllSucursales(): void {
    this.loading.set(true);
    this.sucursalService.getAllSucursales().subscribe({
      next: (data) => {
        this.allSucursales.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onEmpresaChange(id: string | null): void {
    this.selectedEmpresaId.set(id);
  }

  refreshData() {
    this.loadAllSucursales();
  }

  openCreate() {
    this.selectedSucursal.set(null);
    this.displayModal.set(true);
  }

  openEdit(sucursal: Sucursal) {
    let empresaId = null;
    if (this.isSuperAdmin()) {
      const empresaEncontrada = this.empresas().find(e => e.razonSocial === sucursal.empresa);
      empresaId = empresaEncontrada ? empresaEncontrada.id : null;
    } else {
      empresaId = this.authService.getEmpresaId();
    }

    const dataParaModal = {
      ...sucursal,
      empresa: empresaId
    };
    this.selectedSucursal.set(dataParaModal as any);
    this.displayModal.set(true);
  }

  // --- 🚀 NUEVA LÓGICA DE GUARDADO CENTRALIZADA ---
  handleGuardarSucursal(event: SucursalModalData) {
    this.isSaving.set(true); // Bloquea el botón del modal

    const request = event.isEdit && this.selectedSucursal()
      ? this.sucursalService.updateSucursal(event.data, this.selectedSucursal()!.id)
      : this.sucursalService.createSucursal(event.data);

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.displayModal.set(false); // Cerramos el modal

        Swal.fire({
          title: event.isEdit ? '¡Actualizado!' : '¡Registrado!',
          text: `La sucursal se ha ${event.isEdit ? 'actualizado' : 'creado'} correctamente.`,
          icon: 'success',
          confirmButtonColor: '#18181b',
          timer: 2000,
          showConfirmButton: false
        });

        this.refreshData(); // Recargamos la tabla automáticamente
      },
      error: (err) => {
        this.isSaving.set(false);

        // Atrapamos la excepción del backend (ej. Nombre duplicado, RUC en uso, etc.)
        const titleError = err.error.error || 'Error al guardar';
        const backendMessage = err.error?.message || err.message || 'No se pudo procesar la solicitud.';

        Swal.fire({
          title: titleError,
          text: backendMessage,
          icon: 'warning',
          confirmButtonColor: '#18181b'
        });
      }
    });
  }

  deleteSucursal(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará la sucursal de forma permanente y sus datos relacionados",
      icon: 'warning',
      iconColor: '#EF4444',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true, // Pone el botón de cancelar a la izquierda
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.sucursalService.deleteSucursal(id).subscribe({
          next: () => {
            this.refreshData();
            Swal.fire({
              title: '¡Eliminado!',
              text: 'La sucursal ha sido borrada lógicamente.',
              icon: 'success',
              confirmButtonColor: '#18181b',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            const serverMessage = err?.error?.message || 'No se pudo eliminar la sucursal.';
            Swal.fire({
              title: 'Error',
              text: serverMessage,
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }

  toggleStatus(sucursal: Sucursal) {
    const actionText = sucursal.estado ? 'desactivar' : 'activar';
    Swal.fire({
      title: `¿Confirmas ${actionText} la sucursal?`,
      text: `Esta acción cambiará el estado de la sucursal ${sucursal.nombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#18181b',
      cancelButtonColor: '#71717a'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading.set(true);
        this.sucursalService.toggleStatus(sucursal.id).subscribe({
          next: () => {
            this.loading.set(false);
            Swal.fire({
              title: '¡Éxito!',
              text: `Sucursal ${sucursal.estado ? 'desactivada' : 'activada'} correctamente.`,
              icon: 'success',
              confirmButtonColor: '#18181b',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadAllSucursales();
          },
          error: (err) => {
            this.loading.set(false);
            const backendMessage = err.error?.message || err.message || 'No se pudo procesar la solicitud.';
            Swal.fire({
              title: 'Error',
              text: backendMessage,
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }
}