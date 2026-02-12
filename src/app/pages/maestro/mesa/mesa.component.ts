import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MesaService } from '../../../services/maestro/mesa.service';
import { Mesa } from '../../../models/maestro/mesa.model';
import { ModalMesaComponent } from './modal-mesa/modal-mesa.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/auth/auth.service';
import { PisoService } from '../../../services/maestro/piso.service';
import { Piso } from '../../../models/maestro/piso.model';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, ModalMesaComponent, HasPermissionDirective, TooltipModule, TagModule, DropdownModule, FormsModule],
  templateUrl: './mesa.component.html',
  styleUrls: ['./mesa.component.css']
})
export class MesaComponent implements OnInit {

  private mesaService = inject(MesaService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private pisoService = inject(PisoService);

  mesas = signal<Mesa[]>([]);
  filteredMesas = signal<Mesa[]>([]);
  pisos = signal<Piso[]>([]); // Lista de pisos para el select
  pisoSeleccionado = signal<string | null>(null); // El ID del piso actual

  displayModal = false;
  selectedMesa: Mesa | null = null;

  pisoNombreActual = computed(() => {
    const idPiso = this.pisoSeleccionado();
    const listaPisos = this.pisos();
    const pisoEncontrado = listaPisos.find(p => p.id === idPiso);
    return pisoEncontrado ? pisoEncontrado.nombre : 'Sin piso seleccionado';
  });

  // Extraemos sucursalId del token para el modal
  get sucursalId(): string {
    const token = this.authService.getToken();
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sucursalId;
  }

  ngOnInit(): void {
    // 1. Capturamos si viene un ID por URL primero
    const idPisoUrl = this.route.snapshot.queryParams['piso'];

    this.pisoService.getPisosBySucursal(this.sucursalId).subscribe({
      next: (data) => {
        this.pisos.set(data);

        if (data.length > 0) {
          // Si hay ID en URL y existe en la lista, lo usamos. Si no, usamos el primero.
          const defaultId = idPisoUrl && data.some(p => p.id === idPisoUrl)
            ? idPisoUrl
            : data[0].id;

          this.pisoSeleccionado.set(defaultId);
          this.loadMesas();
        }
      }
    });
  }

  async loadInitialData() {
    const sId = this.sucursalId;
    if (!sId) return;

    // 1. Cargamos los pisos de la sucursal
    this.pisoService.getPisosBySucursal(sId).subscribe({
      next: (data) => {
        this.pisos.set(data);

        // 2. Si hay pisos, seleccionamos el primero por defecto (si no viene por URL)
        if (data.length > 0) {
          const defaultPisoId = data[0].id;
          this.pisoSeleccionado.set(defaultPisoId);
          this.loadMesas(); // Cargamos las mesas del piso inicial
        }
      }
    });
  }

  // Se dispara cuando el usuario cambia el piso en el select
  onPisoChange(event: any) {
    this.pisoSeleccionado.set(event.value);
    this.loadMesas();
  }

  loadMesas() {
    const id = this.pisoSeleccionado();
    if (!id) return;

    this.mesaService.getMesasByPiso(id).subscribe({
      next: (data) => {
        this.mesas.set(data);
        this.filteredMesas.set(data);
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredMesas.set(
      this.mesas().filter(m => m.codigoMesa.toLowerCase().includes(value))
    );
  }

  openCreate() {
    this.selectedMesa = null;
    this.displayModal = true;
  }

  onEdit(mesa: Mesa) {
    if (this.isMesaOcupada(mesa)) {
      this.showBlockedAlert('editar');
      return;
    }
    this.selectedMesa = { ...mesa };
    this.displayModal = true;
  }

  onDelete(id: string, mesa: Mesa) {
    if (this.isMesaOcupada(mesa)) {
      this.showBlockedAlert('eliminar');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará la mesa de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f54cc',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Llamada al servicio si el usuario confirma
        this.mesaService.deleteMesa(id).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'La mesa ha sido eliminada correctamente.',
              icon: 'success',
              confirmButtonColor: '#18181b',
              timer: 2000
            });
            this.loadInitialData(); // Recargamos la lista
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la mesa. Es posible que esté en uso.',
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }

  // Validaciones de estado
  isMesaOcupada(mesa: Mesa): boolean {
    return mesa.estado === 'OCUPADA' || mesa.estado === 'RESERVADA';
  }

  showBlockedAlert(accion: string) {
    Swal.fire({
      title: 'Acción bloqueada',
      text: `No se puede ${accion} una mesa que está OCUPADA o RESERVADA.`,
      icon: 'error',
      confirmButtonColor: '#18181b'
    });
  }

  getSeverity(estado: string) {
    switch (estado.toUpperCase()) {
      case 'DISPONIBLE': case 'LIBRE': return 'success';
      case 'OCUPADA': return 'danger';
      case 'RESERVADA': return 'info';
      default: return 'secondary';
    }
  }
}