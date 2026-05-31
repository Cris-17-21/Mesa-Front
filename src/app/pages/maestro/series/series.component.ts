import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2';

// Servicios y Modelos
import { FacturacionService } from '../../../services/venta/facturacion.service';
import { SucursalService } from '../../../services/maestro/sucursal.service';
import { Sucursal } from '../../../models/maestro/sucursal.model';
import { AuthService } from '../../../core/auth/auth.service';

// Componente Modal
import { ModalSeriesComponent, SeriesModalData } from './modal-series/modal-series.component';

@Component({
  selector: 'app-series',
  standalone: true,
  imports: [
    TableModule, IconFieldModule, InputIconModule,
    SelectModule, ModalSeriesComponent, FormsModule
  ],
  templateUrl: './series.component.html',
  styleUrl: './series.component.css'
})
export class SeriesComponent implements OnInit {

  private readonly facturacionService = inject(FacturacionService);
  private readonly sucursalService = inject(SucursalService);
  private readonly authService = inject(AuthService);

  readonly isSuperAdmin = this.authService.isSuperAdmin;

  readonly seriesList = signal<any[]>([]);
  readonly sucursales = signal<Sucursal[]>([]);
  readonly selectedSucursalId = signal<string | null>(null);

  readonly displayModal = signal(false);
  readonly loading = signal(false);
  readonly isSaving = signal(false);

  ngOnInit(): void {
    this.loadSucursales();
  }

  loadSucursales(): void {
    this.loading.set(true);
    if (this.isSuperAdmin()) {
      this.sucursalService.getAllActiveSucursales().subscribe({
        next: (data) => {
          this.sucursales.set(data);
          if (data.length > 0) {
            this.selectedSucursalId.set(data[0].id);
            this.loadSeries(data[0].id);
          } else {
            this.loading.set(false);
          }
        },
        error: () => this.loading.set(false)
      });
    } else {
      const empresaId = this.authService.getEmpresaId();
      this.sucursalService.getSucursalByEmpresaId(empresaId).subscribe({
        next: (data) => {
          this.sucursales.set(data);
          if (data.length > 0) {
            this.selectedSucursalId.set(data[0].id);
            this.loadSeries(data[0].id);
          } else {
            this.loading.set(false);
          }
        },
        error: () => this.loading.set(false)
      });
    }
  }

  loadSeries(sucursalId: string): void {
    this.loading.set(true);
    this.facturacionService.obtenerSeries(sucursalId).subscribe({
      next: (data) => {
        this.seriesList.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar series:', err);
        this.seriesList.set([]);
        this.loading.set(false);
      }
    });
  }

  onSucursalChange(id: string | null): void {
    this.selectedSucursalId.set(id);
    if (id) {
      this.loadSeries(id);
    } else {
      this.seriesList.set([]);
    }
  }

  refreshData() {
    const sucursalId = this.selectedSucursalId();
    if (sucursalId) {
      this.loadSeries(sucursalId);
    }
  }

  openCreate() {
    this.displayModal.set(true);
  }

  handleGuardarSerie(event: SeriesModalData) {
    this.isSaving.set(true);
    
    this.facturacionService.configurarSeries(
      event.sucursalId,
      event.tipoDoc,
      event.serie,
      event.correlativo
    ).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.displayModal.set(false);

        Swal.fire({
          title: '¡Registrado!',
          text: 'La serie se ha configurado correctamente tanto localmente como en el facturador.',
          icon: 'success',
          confirmButtonColor: '#18181b',
          timer: 2000,
          showConfirmButton: false
        });

        // Recargar si coincide la sucursal seleccionada
        if (event.sucursalId === this.selectedSucursalId()) {
          this.refreshData();
        } else {
          this.selectedSucursalId.set(event.sucursalId);
          this.loadSeries(event.sucursalId);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const titleError = err.error?.error || 'Error al guardar';
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
}
