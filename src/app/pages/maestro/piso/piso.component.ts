import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Módulos de PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

// Modelos y Servicios
import { Piso } from '../../../models/maestro/piso.model';
import { PisoService } from '../../../services/maestro/piso.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';

// Componentes y Directivas
import { ModalPisoComponent } from './modal-piso/modal-piso.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

export interface PisoWizardData {
  isEdit: boolean;
  data: Partial<Piso>;
}

@Component({
  selector: 'app-pisos',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ModalPisoComponent,
    HasPermissionDirective
  ],
  templateUrl: './piso.component.html',
  styleUrls: ['./piso.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PisoComponent implements OnInit {

  // Inyección de servicios
  private readonly pisoService = inject(PisoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals de estado
  readonly pisos = signal<Piso[]>([]);
  readonly filteredPisos = signal<Piso[]>([]);
  readonly displayModal = signal(false);
  readonly selectedPiso = signal<Piso | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    if (this.sucursalId) {
      this.loadPisos();
    } else {
      this.errorMessage('ACCESO DENEGADO', 'No se encontró una sucursal válida.');
    }
  }

  loadPisos(): void {
    this.pisoService.getPisosBySucursal(this.sucursalId).subscribe({
      next: (data) => {
        this.pisos.set(data);
        this.filteredPisos.set(data);
      },
      error: (err) => this.errorMessage('Error al cargar la lista de pisos', err)
    });
  }

  openCreate(): void {
    this.selectedPiso.set(null);
    this.displayModal.set(true);
  }

  openEdit(piso: Piso): void {
    this.selectedPiso.set(piso);
    this.displayModal.set(true);
  }

  handleSave(wizardData: PisoWizardData): void {
    const { data, isEdit } = wizardData;
    this.loading.set(true);

    if (isEdit) {
      const id = this.selectedPiso()?.id;
      if (!id) {
        this.errorMessage('Error interno: ID de piso no encontrado');
        this.loading.set(false);
        return;
      }

      this.pisoService.updatePiso(id, data)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.successMessage('PISO ACTUALIZADO');
            this.loadPisos();
            this.displayModal.set(false);
          },
          error: (err) => this.errorMessage('Error al actualizar el piso', err)
        });
    } else {
      const payload = { ...data, sucursalId: this.sucursalId };

      this.pisoService.createPiso(payload as Piso)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.successMessage('PISO CREADO CON ÉXITO');
            this.loadPisos();
            this.displayModal.set(false);
          },
          error: (err) => this.errorMessage('Error al registrar el piso', err)
        });
    }
  }

  deletePiso(id: string): void {
    Swal.fire({
      title: '¿ESTÁS SEGURO?',
      text: "Esta acción eliminará el piso y sus mesas asociadas de forma permanente",
      icon: 'warning',
      iconColor: '#EF4444',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.pisoService.deletePiso(id).subscribe({
          next: () => {
            this.loadPisos();
            this.successMessage('Piso eliminado correctamente.');
          },
          error: (err) => this.errorMessage('No se pudo eliminar el piso. Verifique si tiene pedidos activos.', err)
        });
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();

    if (!value) {
      this.filteredPisos.set(this.pisos());
      return;
    }

    this.filteredPisos.set(
      this.pisos().filter(p =>
        p.nombre.toLowerCase().includes(value) ||
        p.descripcion?.toLowerCase().includes(value)
      )
    );
  }

  get sucursalId(): string {
    return this.authService.getSucursalId();
  }

  goToMesaDesign(pisoId: string): void {
    this.router.navigate(['/maestros/mesas'], { queryParams: { piso: pisoId } });
  }

  // --- MÉTODOS PRIVADOS DE UI ---

  private successMessage(msg: string): void {
    Swal.fire({
      title: '¡ÉXITO!',
      text: msg,
      icon: 'success',
      confirmButtonColor: '#18181b',
      timer: 2000
    });
  }

  private errorMessage(contextMessage: string, err?: HttpErrorResponse | any): void {
    const serverTitle = err?.error?.error || 'ERROR';
    const serverMessage = err?.error?.message || contextMessage;

    Swal.fire({
      title: serverTitle,
      text: serverMessage,
      icon: 'error',
      confirmButtonColor: '#18181b'
    });
  }
}