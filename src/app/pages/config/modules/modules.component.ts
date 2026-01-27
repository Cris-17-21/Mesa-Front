import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ModuleService } from '../../../services/config/module.service';
import { Module } from '../../../models/security/module.model';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';
import { ModalModulesComponent } from './modal-modules/modal-modules.component';

@Component({
  selector: 'app-modules',
  imports: [CommonModule, TableModule, IconFieldModule, InputIconModule, MultiSelectModule, SelectModule, ModalModulesComponent],
  standalone: true,
  templateUrl: './modules.component.html',
  styleUrl: './modules.component.css'
})
export class ModulesComponent implements OnInit {

  private moduleService = inject(ModuleService);

  modules: Module[] = [];
  displayModal = signal(false);
  selectedModule = signal<Module | null>(null);

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.moduleService.getAllModules().subscribe({
      next: (data) => this.modules = data,
      error: (err) => console.error('Error', err)
    });
  }

  // MÉTODO PARA CREAR (Limpia el permiso seleccionado)
  openCreate() {
    this.selectedModule.set(null);
    this.displayModal.set(true);
  }

  // MÉTODO PARA EDITAR (Pasa el permiso de la fila)
  openEdit(module: Module) {
    this.selectedModule.set(module);
    this.displayModal.set(true);
  }

  deleteModule(id: string) {
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
        this.moduleService.deleteModule(id).subscribe({
          next: () => {
            // Opción A: Refrescar toda la tabla desde el servidor
            this.loadModules();

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
