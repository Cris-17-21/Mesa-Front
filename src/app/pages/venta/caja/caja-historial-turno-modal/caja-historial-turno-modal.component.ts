import { Component, inject, signal, input, model, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';

// Servicios
import { CajaService } from '../../../../services/venta/caja.service';
import { MovimientoCajaService } from '../../../../services/venta/movimiento-caja.service';
import { CajaResumenDto } from '../../../../models/venta/caja.model';
import { MovimientoCajaResponse } from '../../../../models/venta/caja-movimiento';

@Component({
    selector: 'app-caja-historial-turno-modal',
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        TableModule
    ],
    templateUrl: './caja-historial-turno-modal.component.html',
    styleUrl: './caja-historial-turno-modal.component.css'
})
export class CajaHistorialTurnoModalComponent {
    private cajaService = inject(CajaService);
    private movimientoService = inject(MovimientoCajaService);

    // INPUTS
    visible = model<boolean>(false);
    turnoId = input<string | null>(null);

    // STATE
    resumen = signal<CajaResumenDto | null>(null);
    movimientos = signal<MovimientoCajaResponse[]>([]);
    loading = signal(false);

    constructor() {
        effect(() => {
            const id = this.turnoId();
            if (this.visible() && id) {
                this.cargarDatos(id);
            }
        });
    }

    private cargarDatos(id: string) {
        this.loading.set(true);

        // Cargar Resumen (Arqueo)
        this.cajaService.obtenerResumenArqueo(id).subscribe({
            next: (data) => this.resumen.set(data),
            error: () => this.resumen.set(null)
        });

        // Cargar Movimientos
        this.movimientoService.consultarMovimientos(id).subscribe({
            next: (data) => {
                this.movimientos.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.movimientos.set([]);
                this.loading.set(false);
            }
        });
    }

    close() {
        this.visible.set(false);
    }
}
