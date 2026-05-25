import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturacionService } from '../../../services/venta/facturacion.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ComprobanteResponse, BuscarComprobantesParams, EstadoSunat } from '../../../models/venta/facturacion.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-facturacion-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './facturacion-history.component.html',
    styleUrl: './facturacion-history.component.css'
})
export class FacturacionHistoryComponent implements OnInit {
    private facturacionService = inject(FacturacionService);
    private authService = inject(AuthService);

    comprobantes = signal<ComprobanteResponse[]>([]);
    cargando = signal<boolean>(false);

    // Signals para filtros
    filtroEstado = signal<string>('');
    filtroFechaDesde = signal<string>('');
    filtroFechaHasta = signal<string>('');
    filtroTipo = signal<string>('');

    ngOnInit() {
        this.buscar();
    }

    buscar() {
        this.cargando.set(true);

        const params: BuscarComprobantesParams = {};
        if (this.filtroEstado()) params.estado = this.filtroEstado() as EstadoSunat;
        if (this.filtroFechaDesde()) params.fechaDesde = this.filtroFechaDesde();
        if (this.filtroFechaHasta()) params.fechaHasta = this.filtroFechaHasta();
        if (this.filtroTipo()) params.tipo = this.filtroTipo() as '01' | '03' | '02';

        this.facturacionService.buscarComprobantes(params).subscribe({
            next: (data) => {
                this.comprobantes.set(data);
                this.cargando.set(false);
            },
            error: (err: any) => {
                this.cargando.set(false);
                console.error('Error buscando comprobantes:', err);
            }
        });
    }

    limpiarFiltros() {
        this.filtroEstado.set('');
        this.filtroFechaDesde.set('');
        this.filtroFechaHasta.set('');
        this.filtroTipo.set('');
        this.buscar();
    }

    enviarASunat(id: string) {
        Swal.fire({
            title: '¿Enviar a SUNAT?',
            text: 'Se intentará forzar el envío del comprobante seleccionado.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#18181b',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, enviar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Enviando...',
                    text: 'Por favor, espere.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                this.facturacionService.enviarASunat(id).subscribe({
                    next: (res) => {
                        Swal.fire({
                            title: '¡Comprobante Procesado!',
                            text: `Estado final: ${res.estadoSunat}`,
                            icon: res.estadoSunat === 'ACEPTADO' ? 'success' : 'warning',
                            confirmButtonColor: '#18181b'
                        });
                        this.buscar(); // Recargar historial
                    },
                    error: (err) => {
                        console.error(err);
                        const msg = err.error?.message || 'No se pudo enviar el comprobante.';
                        Swal.fire('Error', msg, 'error');
                    }
                });
            }
        });
    }

    verPdf(url: string | undefined) {
        if (url) {
            window.open(url, '_blank', 'noopener');
        }
    }

    descargarXml(url: string | undefined) {
        if (url) {
            window.open(url, '_blank');
        }
    }
}
