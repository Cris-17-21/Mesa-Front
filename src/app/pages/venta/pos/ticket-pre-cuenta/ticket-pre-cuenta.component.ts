import { Component, input } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { PedidoResponseDto } from '../../../../models/venta/pedido.model';

@Component({
    selector: 'app-ticket-pre-cuenta',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe],
    templateUrl: './ticket-pre-cuenta.component.html',
    styleUrl: './ticket-pre-cuenta.component.css'
})
export class TicketPreCuentaComponent {
    pedido = input.required<PedidoResponseDto>();

    // Datos constantes del restaurante (esto podría venir de un servicio de configuración)
    restaurante = {
        nombre: 'MI RESTAURANTE NOIR',
        ruc: '20123456789',
        direccion: 'Av. Las Gardenias 1234, Lima',
        telefono: '(01) 444-5555'
    };

    get igv() {
        return this.pedido().totalFinal * 0.18;
    }

    get subtotal() {
        return this.pedido().totalFinal - this.igv;
    }

    print() {
        window.print();
    }
}
