import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { SucursalService } from '../../../services/maestro/sucursal.service';
import { Sucursal } from '../../../models/maestro/sucursal.model';
import { UserService } from '../../../services/user/user.service';
import { ModalSucursalComponent } from './modal-sucursal/modal-sucursal.component';
import { EmpresaService } from '../../../services/maestro/empresa.service';
import { Empresa } from '../../../models/maestro/empresa.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sucursal',
  imports: [CommonModule, TableModule, IconFieldModule, InputIconModule, MultiSelectModule, SelectModule, ModalSucursalComponent, FormsModule],
  templateUrl: './sucursal.component.html',
  styleUrl: './sucursal.component.css'
})
export class SucursalComponent implements OnInit {

  private sucursalService = inject(SucursalService);
  private empresaService = inject(EmpresaService);

  sucursales = signal<Sucursal[]>([]);
  empresas = signal<Empresa[]>([]);
  selectedSucursal = signal<Sucursal | null>(null);
  selectedEmpresaId = signal<string | null>(null);

  displayModal = signal(false);
  loading = signal(false);

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading.set(true);
    // Cargamos empresas y sucursales en paralelo o secuencia
    this.empresaService.getAllEmpresas().subscribe(data => this.empresas.set(data));
    this.loadAllSucursales();
  }
  
  loadAllSucursales(): void {
    this.loading.set(true);
    this.sucursalService.getAllSucursales().subscribe({
      next: (data) => {
        this.sucursales.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onEmpresaChange(id: string | null): void {
    this.selectedEmpresaId.set(id);
    if (!id) {
      this.loadAllSucursales(); // Si limpia el filtro, carga todo
    } else {
      this.loading.set(true);
      this.sucursalService.getSucursalByEmpresaId(id).subscribe({
        next: (data) => {
          this.sucursales.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  refreshData() {
    this.onEmpresaChange(this.selectedEmpresaId());
  }

  // MÉTODO PARA CREAR (Limpia el permiso seleccionado)
  openCreate() {
    this.selectedSucursal.set(null);
    this.displayModal.set(true);
  }

  // MÉTODO PARA EDITAR (Pasa el permiso de la fila)
  openEdit(sucursal: Sucursal) {
    this.selectedSucursal.set(sucursal);
    this.displayModal.set(true);
  }

  deleteSucursal(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará la sucursal de forma permanente.",
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
        this.sucursalService.deleteSucursal(id).subscribe({
          next: () => {
            // Opción A: Refrescar toda la tabla desde el servidor
            this.refreshData();

            // Opción B (Más rápida): Filtrar el array localmente
            // this.permissions = this.permissions.filter(p => p.id !== id);

            Swal.fire({
              title: '¡Eliminado!',
              text: 'La sucursal ha sido borrada correctamente.',
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
              text: 'No se pudo eliminar la sucursal. Es posible que esté en uso.',
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }
}
