import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CompraService, PedidoCompraDto, RecepcionPedidoRequest } from '../../../../services/compra/compra.service';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-compra-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        CardModule,
        DialogModule,
        RadioButtonModule,
        InputTextModule,
        TextareaModule
    ],
    providers: [MessageService],
    templateUrl: './compra-list.component.html',
    styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CompraListComponent implements OnInit {
    private compraService = inject(CompraService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    compras: PedidoCompraDto[] = [];
    loading: boolean = true;

    mostrarRecepcion: boolean = false;
    compraSeleccionada: PedidoCompraDto | null = null;
    tipoRecepcion: 'total' | 'parcial' = 'parcial';
    detallesPendientes: any[] = [];
    totalPendiente: number = 0;
    observacionesRecepcion: string = '';

    ngOnInit() {
        this.loadCompras();
    }

    loadCompras() {
        this.loading = true;
        this.compraService.getAll().subscribe({
            next: (data) => {
                this.compras = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error cargando compras', err);
                this.loading = false;
            }
        });
    }

    createCompra() {
        this.router.navigate(['/compras/gestion/nuevo']);
    }

    getSeverity(estado: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
        switch (estado) {
            case 'Pagado':
            case 'PAGADO':
                return 'success';
            case 'Pendiente':
            case 'PENDIENTE':
                return 'warning';
            case 'Anulado':
            case 'ANULADO':
                return 'danger';
            default:
                return 'info';
        }
    }

    abrirRecepcion(compra: PedidoCompraDto) {
        this.compraSeleccionada = compra;
        this.tipoRecepcion = 'total';
        this.observacionesRecepcion = '';
        
        // Cargar detalles y calcular pendientes
        this.detallesPendientes = (compra.detalles || [])
            .map(d => ({
                idDetallePedido: d.idDetallePedido,
                nombreProducto: d.nombreProducto,
                cantidadPedida: d.cantidadPedida || 0,
                cantidadRecibida: (d as any).cantidadRecibida || 0, // Casting assuming backend returns it
                cantidadARecibir: 0
            }))
            .filter(d => (d.cantidadPedida - d.cantidadRecibida) > 0);

        this.totalPendiente = this.detallesPendientes.reduce((acc, curr) => acc + (curr.cantidadPedida - curr.cantidadRecibida), 0);
        this.onTipoRecepcionChange();
        this.mostrarRecepcion = true;
    }

    onTipoRecepcionChange() {
        if (this.tipoRecepcion === 'total') {
            this.detallesPendientes.forEach(d => d.cantidadARecibir = d.cantidadPedida - d.cantidadRecibida);
        } else {
            this.detallesPendientes.forEach(d => d.cantidadARecibir = 0);
        }
    }

    validarCantidad(detalle: any) {
        const pendiente = detalle.cantidadPedida - detalle.cantidadRecibida;
        if (detalle.cantidadARecibir < 0) detalle.cantidadARecibir = 0;
        if (detalle.cantidadARecibir > pendiente) detalle.cantidadARecibir = pendiente;
    }

    puedeRecibir(): boolean {
        return this.detallesPendientes.some(d => d.cantidadARecibir > 0);
    }

    confirmarRecepcion() {
        if (!this.compraSeleccionada || !this.compraSeleccionada.idPedidoCompra) return;

        const request: RecepcionPedidoRequest = {
            detalles: this.detallesPendientes
                .filter(d => d.cantidadARecibir > 0)
                .map(d => ({
                    idDetallePedido: d.idDetallePedido,
                    cantidadRecibida: d.cantidadARecibir
                })),
            observaciones: this.observacionesRecepcion
        };

        this.compraService.registrarRecepcion(this.compraSeleccionada.idPedidoCompra, request).subscribe({
            next: () => {
                this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Recepción registrada'});
                this.mostrarRecepcion = false;
                this.loadCompras();
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo registrar la recepción'});
            }
        });
    }
}
