import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import Swal from 'sweetalert2';
import { ModalClienteComponent } from './modal-cliente/modal-cliente.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { ClienteService } from '../../../services/maestro/cliente.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Cliente } from '../../../models/maestro/cliente.model';

@Component({
  selector: 'app-cliente',
  imports: [CommonModule, ModalClienteComponent, HasPermissionDirective, TableModule, TooltipModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.css'
})
export class ClienteComponent implements OnInit {

  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);

  clientes = signal<Cliente[]>([]);
  filteredClientes = signal<Cliente[]>([]);
  loading = signal(false);

  displayModal = false;
  selectedCliente: Cliente | null = null;

  get empresaId(): string {
    const token = this.authService.getToken();
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.empresaId; // Ajustar según estructura de tu token
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes() {
    if (!this.empresaId) return;
    this.loading.set(true);
    this.clienteService.getAllClientesByEmpresa(this.empresaId).subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.filteredClientes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredClientes.set(
      this.clientes().filter(c =>
        c.nombreRazonSocial.toLowerCase().includes(value) ||
        c.numeroDocumento.includes(value)
      )
    );
  }

  openCreate() {
    this.selectedCliente = null;
    this.displayModal = true;
  }

  onEdit(cliente: Cliente) {
    this.selectedCliente = { ...cliente };
    this.displayModal = true;
  }

  onDelete(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará el cliente de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Color negro de tu estilo Noir
      cancelButtonColor: '#3f54cc', // Rojo suave para cancelar
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true, // Pone el botón de cancelar a la izquierda
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.deleteCliente(id).subscribe({
          next: () => {
            this.loadClientes()
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El cliente ha sido borrado correctamente.',
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
              text: 'No se pudo eliminar el cliente. Es posible que esté en uso.',
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }
}
