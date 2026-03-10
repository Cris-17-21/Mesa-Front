import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';

import { CreateMetodoPagoDto, MetodoPago } from '../../../models/maestro/metodo-pago.model';
import { MetodoPagoService } from '../../../services/maestro/metodo-pago.service';
import { AuthService } from '../../../core/auth/auth.service';

import { ModalMetodoPagoComponent } from './modal-metodo-pago/modal-metodo-pago.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

export interface MetodoPagoWizardData {
  isEdit: boolean;
  data: Partial<MetodoPago>;
}

@Component({
  selector: 'app-metodo-pago',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    TableModule,
    ModalMetodoPagoComponent,
    HasPermissionDirective
  ],
  templateUrl: './metodo-pago.component.html',
  styleUrls: ['./metodo-pago.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetodoPagoComponent implements OnInit {

  private readonly metodoPagoService = inject(MetodoPagoService);
  private readonly authService = inject(AuthService);

  readonly metodosPago = signal<MetodoPago[]>([]);
  readonly filteredMetodosPago = signal<MetodoPago[]>([]);
  readonly displayModal = signal(false);
  readonly selectedMetodoPago = signal<MetodoPago | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    if (this.empresaId) {
      this.loadMetodosPago();
    } else {
      this.errorMessage('ACCESO DENEGADO', 'No se encontró una empresa válida.');
    }
  }

  loadMetodosPago(): void {
    this.metodoPagoService.getMetodoPagoByEmpresa(this.empresaId).subscribe({
      next: (data) => {
        this.metodosPago.set(data);
        this.filteredMetodosPago.set(data);
      },
      error: (err) => this.errorMessage('Error al cargar métodos de pago', err)
    });
  }

  openCreate(): void {
    this.selectedMetodoPago.set(null);
    this.displayModal.set(true);
  }

  openEdit(metodoPago: MetodoPago): void {
    this.selectedMetodoPago.set(metodoPago);
    this.displayModal.set(true);
  }

  handleSave(wizardData: MetodoPagoWizardData): void {
    const { data, isEdit } = wizardData;
    this.loading.set(true);

    if (isEdit) {
      const id = this.selectedMetodoPago()?.id;
      if (!id) {
        this.errorMessage('Error interno: ID de método de pago no encontrado');
        this.loading.set(false);
        return;
      }

      this.metodoPagoService.updateMetodoPago(data, id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.successMessage('MÉTODO DE PAGO ACTUALIZADO');
            this.loadMetodosPago();
            this.displayModal.set(false);
          },
          error: (err) => this.errorMessage('Error al actualizar el método de pago', err)
        });
    } else {
      const payload = { ...data, empresaId: this.empresaId };

      this.metodoPagoService.createMetodoPago(payload as CreateMetodoPagoDto)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.successMessage('MÉTODO DE PAGO CREADO CON ÉXITO');
            this.loadMetodosPago();
            this.displayModal.set(false);
          },
          error: (err) => this.errorMessage('Error al registrar el método de pago', err)
        });
    }
  }

  deleteMetodoPago(id: string): void {
    Swal.fire({
      title: '¿ESTÁS SEGURO?',
      text: 'Esta acción eliminará el método de pago.',
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
        this.metodoPagoService.deleteMetodoPago(id, this.empresaId).subscribe({
          next: () => {
            this.loadMetodosPago();
            this.successMessage('Método de pago eliminado correctamente');
          },
          error: (err) => this.errorMessage('No se pudo eliminar el método de pago.', err)
        });
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();

    if (!value) {
      this.filteredMetodosPago.set(this.metodosPago());
      return;
    }

    this.filteredMetodosPago.set(
      this.metodosPago().filter(mp =>
        mp.nombre.toLowerCase().includes(value)
      )
    );
  }

  getSeverity(isActive: boolean): 'success' | 'danger' | 'secondary' {
    return isActive ? 'success' : 'danger';
  }

  get empresaId(): string {
    return this.authService.getEmpresaId();
  }

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
