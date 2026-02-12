import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Piso } from '../../../models/maestro/piso.model';
import { PisoService } from '../../../services/maestro/piso.service';
import { Router } from '@angular/router';
import { ModalPisoComponent } from './modal-piso/modal-piso.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { AuthService } from '../../../core/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pisos',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TooltipModule, ModalPisoComponent, HasPermissionDirective],
  templateUrl: './piso.component.html',
  styleUrls: ['./piso.component.css']
})
export class PisoComponent implements OnInit {

  pisos: Piso[] = [];
  displayModal: boolean = false;
  selectedPiso: Piso | null = null;
  filteredPisos: Piso[] = [];

  private pisoService = inject(PisoService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Obtenemos el ID de la empresa/sucursal desde el token
  get sucursalId(): string {
    const token = this.authService.getToken();
    if (!token) return '';

    try {
      // Decodificamos el payload del JWT
      const payload = JSON.parse(atob(token.split('.')[1]));

      // IMPORTANTE: Tu token tiene 'sucursalId'. Úsalo para los pisos.
      // Antes estabas usando 'empresaId', por eso el 403.
      return payload.sucursalId;
    } catch (e) {
      console.error('Error al decodificar token:', e);
      return '';
    }
  }

  ngOnInit(): void {
    if (this.sucursalId) {
      this.loadPisos();
    } else {
      console.warn('No se encontró sucursalId en el token. El acceso será denegado.');
    }
  }

  loadPisos() {
    const id = this.sucursalId;
    console.log('Intentando cargar pisos para la sucursal:', id); // Verifica que empiece con 4f6f0...

    if (!id) {
      console.error('No hay un ID de sucursal válido');
      return;
    }

    this.pisoService.getPisosBySucursal(id).subscribe({
      next: (data) => {
        this.pisos = data;
        this.filteredPisos = data;
        console.log('Pisos cargados:', data);
      },
      error: (err) => {
        console.error('Error capturado en el componente:', err);
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    
    if (!value) {
      this.filteredPisos = [...this.pisos];
      return;
    }

    this.filteredPisos = this.pisos.filter(piso => 
      piso.nombre.toLowerCase().includes(value) || 
      piso.descripcion?.toLowerCase().includes(value)
    );
  }

  openCreate() {
    this.selectedPiso = null;
    this.displayModal = true;
  }

  onEdit(piso: Piso) {
    this.selectedPiso = { ...piso };
    this.displayModal = true;
  }

  onDelete(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará el piso de forma permanente.",
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
        this.pisoService.deletePiso(id).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El piso ha sido eliminado correctamente.',
              icon: 'success',
              confirmButtonColor: '#18181b',
              timer: 2000
            });
            this.loadPisos(); // Recargamos la lista
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el piso. Es posible que esté en uso.',
              icon: 'error',
              confirmButtonColor: '#18181b'
            });
          }
        });
      }
    });
  }

  // MÉTODO PARA NAVEGAR AL MÓDULO DE MESAS FILTRADO POR PISO
  goToMesaDesign(pisoId: string) {
    // Navegamos a la ruta de mesas enviando el ID del piso como parámetro
    this.router.navigate(['/maestros/mesas'], { queryParams: { piso: pisoId } });
  }
}