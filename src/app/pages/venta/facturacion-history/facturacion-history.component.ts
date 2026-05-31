import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FacturacionService } from '../../../services/venta/facturacion.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ComprobanteResponse, BuscarComprobantesParams, EstadoSunat } from '../../../models/venta/facturacion.model';
import Swal from 'sweetalert2';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-facturacion-history',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule],
    templateUrl: './facturacion-history.component.html',
    styleUrl: './facturacion-history.component.css'
})
export class FacturacionHistoryComponent implements OnInit {
    private facturacionService = inject(FacturacionService);
    private authService = inject(AuthService);
    private router = inject(Router);

    comprobantes = signal<ComprobanteResponse[]>([]);
    cargando = signal<boolean>(false);

    // Signals para filtros (Default: PENDIENTE_ENVIO)
    filtroEstado = signal<string>('PENDIENTE_ENVIO');
    filtroFechaDesde = signal<string>('');
    filtroFechaHasta = signal<string>('');
    filtroTipo = signal<string>('');

    // Signals para selección masiva
    selectedIds = signal<Set<string>>(new Set());

    // Verificación de Rol
    isAdmin = computed(() => this.authService.permissions().includes('ROLE_ADMIN_RESTAURANTE'));

    // Computeds para selección masiva
    isAllSelected = computed(() => {
        const pending = this.comprobantes().filter(c => c.estadoSunat === 'PENDIENTE_ENVIO' || !c.estadoSunat);
        if (pending.length === 0) return false;
        return pending.every(c => this.selectedIds().has(c.id));
    });

    isAnySelected = computed(() => {
        return this.selectedIds().size > 0;
    });

    ngOnInit() {
        this.buscar();
    }

    buscar() {
        this.cargando.set(true);
        this.selectedIds.set(new Set());

        const params: BuscarComprobantesParams = {};
        if (this.filtroEstado()) params.estado = this.filtroEstado() as EstadoSunat;
        if (this.filtroFechaDesde()) params.fechaDesde = this.filtroFechaDesde();
        if (this.filtroFechaHasta()) params.fechaHasta = this.filtroFechaHasta();
        if (this.filtroTipo()) params.tipo = this.filtroTipo() as '01' | '03' | '02';

        const sucursalId = this.getSucursalId() || '';
        this.facturacionService.buscarComprobantes(sucursalId, params).subscribe({
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
        this.filtroEstado.set('PENDIENTE_ENVIO');
        this.filtroFechaDesde.set('');
        this.filtroFechaHasta.set('');
        this.filtroTipo.set('');
        this.buscar();
    }

    toggleSelect(id: string) {
        this.selectedIds.update(prev => {
            const copy = new Set(prev);
            if (copy.has(id)) {
                copy.delete(id);
            } else {
                copy.add(id);
            }
            return copy;
        });
    }

    toggleSelectAll(checked: boolean) {
        if (checked) {
            const pendingIds = this.comprobantes()
                .filter(c => c.estadoSunat === 'PENDIENTE_ENVIO' || !c.estadoSunat)
                .map(c => c.id);
            this.selectedIds.set(new Set(pendingIds));
        } else {
            this.selectedIds.set(new Set());
        }
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

    enviarSeleccionados() {
        const ids = Array.from(this.selectedIds());
        if (ids.length === 0) return;

        Swal.fire({
            title: 'Enviando a SUNAT...',
            html: `Procesando comprobante <b>1</b> de ${ids.length}...`,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        let successCount = 0;
        let errorCount = 0;

        const sendNext = (index: number) => {
            if (index >= ids.length) {
                Swal.close();
                Swal.fire({
                    title: 'Envío Masivo Completado',
                    text: `Se enviaron con éxito ${successCount} comprobantes. Errores: ${errorCount}.`,
                    icon: errorCount === 0 ? 'success' : 'warning',
                    confirmButtonColor: '#18181b'
                });
                this.selectedIds.set(new Set());
                this.buscar();
                return;
            }

            Swal.getHtmlContainer()!.innerHTML = `Procesando comprobante <b>${index + 1}</b> de ${ids.length}...`;

            this.facturacionService.enviarASunat(ids[index]).subscribe({
                next: (res) => {
                    if (res.estadoSunat === 'ACEPTADO') {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                    sendNext(index + 1);
                },
                error: (err) => {
                    console.error(err);
                    errorCount++;
                    sendNext(index + 1);
                }
            });
        };

        sendNext(0);
    }

    descargarPdf(id: string, formato: string = 'ticket') {
        Swal.fire({
            title: `Descargando PDF (${formato.toUpperCase()})...`,
            text: 'Por favor espere.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        this.facturacionService.descargarArchivo(id, 'pdf', formato).subscribe({
            next: (blob) => {
                Swal.close();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: (err) => {
                Swal.close();
                console.error(err);
                Swal.fire('Error', 'No se pudo descargar el archivo PDF. Verifique que exista o no haya expirado.', 'error');
            }
        });
    }

    descargarXml(id: string) {
        Swal.fire({
            title: 'Descargando XML...',
            text: 'Por favor espere.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        this.facturacionService.descargarArchivo(id, 'xml').subscribe({
            next: (blob) => {
                Swal.close();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `comprobante-${id}.xml`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                Swal.close();
                console.error(err);
                Swal.fire('Error', 'No se pudo descargar el archivo XML.', 'error');
            }
        });
    }

    eliminarComprobante(c: ComprobanteResponse, deEditar: boolean = false) {
        const actionText = deEditar ? 'eliminar el comprobante y reabrir el pedido para editarlo' : 'eliminar este comprobante y reabrir el pedido';
        Swal.fire({
            title: '¿Confirmar acción?',
            text: `Se va a ${actionText}. Esta operación liberará la mesa y reabrirá la orden original.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#18181b',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Procesando...',
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading(); }
                });

                this.facturacionService.eliminarComprobante(c.id).subscribe({
                    next: () => {
                        Swal.close();
                        Swal.fire({
                            title: '¡Operación Exitosa!',
                            text: 'El comprobante fue eliminado y el pedido ha sido reabierto.',
                            icon: 'success',
                            confirmButtonColor: '#18181b'
                        }).then(() => {
                            if (deEditar) {
                                this.router.navigate(['/ventas/pos']);
                            } else {
                                this.buscar();
                            }
                        });
                    },
                    error: (err) => {
                        Swal.close();
                        console.error(err);
                        const msg = err.error?.message || 'No se pudo eliminar el comprobante.';
                        Swal.fire('Error', msg, 'error');
                    }
                });
            }
        });
    }

    solicitarNotaCredito(c: ComprobanteResponse) {
        Swal.fire({
            title: 'Emitir Nota de Crédito',
            html: `
                <div style="text-align: left; font-family: inherit;">
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 0.8rem; color: #71717a; text-transform: uppercase; font-weight: 600;">Comprobante de Referencia</label>
                        <input type="text" class="swal2-input" style="margin: 4px 0 0 0; width: 100%; box-sizing: border-box; background: #f4f4f5;" value="${c.serie}-${c.correlativo}" readonly>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 0.8rem; color: #71717a; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Motivo de Anulación (SUNAT)*</label>
                        <select id="swal-nc-motivo" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box; height: 42px; font-size: 0.9rem; border: 1px solid #dcdcdc; border-radius: 4px;">
                            <option value="01">01 - Anulación de la operación</option>
                            <option value="02">02 - Anulación por error en el RUC</option>
                            <option value="03">03 - Corrección por error en la descripción</option>
                            <option value="06">06 - Devolución total</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; color: #71717a; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">Descripción / Sustento*</label>
                        <textarea id="swal-nc-desc" class="swal2-textarea" style="margin: 0; width: 100%; box-sizing: border-box; font-size: 0.9rem; height: 80px; border: 1px solid #dcdcdc; border-radius: 4px;" placeholder="Ej: Error en digitación de precios..."></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#18181b',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Emitir Nota',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'noir-swal-popup'
            },
            preConfirm: () => {
                const motivo = (document.getElementById('swal-nc-motivo') as HTMLSelectElement).value;
                const descripcion = (document.getElementById('swal-nc-desc') as HTMLTextAreaElement).value;
                if (!descripcion || descripcion.trim().length < 5) {
                    Swal.showValidationMessage('Debe ingresar un sustento de al menos 5 caracteres.');
                    return false;
                }
                return { codMotivo: motivo, descripcion: descripcion };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                Swal.fire({
                    title: 'Procesando Nota de Crédito...',
                    text: 'Espere, por favor.',
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading(); }
                });

                this.facturacionService.emitirNotaCredito({
                    comprobanteId: c.id,
                    codMotivo: result.value.codMotivo,
                    descripcion: result.value.descripcion
                }).subscribe({
                    next: (res) => {
                        Swal.fire({
                            title: '¡Nota de Crédito Emitida!',
                            text: `Se emitió la serie ${res.serie}-${res.correlativo} con estado ${res.estadoSunat}`,
                            icon: 'success',
                            confirmButtonColor: '#18181b'
                        });
                        this.buscar();
                    },
                    error: (err) => {
                        console.error(err);
                        const msg = err.error?.message || 'No se pudo emitir la nota de crédito.';
                        Swal.fire('Error', msg, 'error');
                    }
                });
            }
        });
    }

    private getSucursalId(): string | null {
        const token = this.authService.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sucursalId || null;
        } catch (e) {
            return null;
        }
    }
}
