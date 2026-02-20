import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../core/environment/environment';

export interface DetallePedidoCompraDto {
    idDetallePedido?: number;
    idProducto: number;
    nombreProducto?: string;
    cantidadPedida: number;
    costoUnitario: number;
    subtotalLinea: number;
}

export interface PedidoCompraDto {
    idPedidoCompra?: number;
    idProveedor: number;
    razonSocialProveedor?: string;
    fechaEntregaEsperada?: string | null;
    idTipoPago?: number | null;
    nombreTipoPago?: string;
    referencia?: string;
    observaciones?: string;
    estadoPedido?: string;
    totalPedido?: number;
    aplicaIgv: boolean;
    detalles: DetallePedidoCompraDto[];
}

export interface TiposPagoDto {
    idTipoPago: number;
    tipoPago: string;
}

@Injectable({ providedIn: 'root' })
export class CompraService {
    private http = inject(HttpClient);
    private API_URL = `${environment.apiUrl}/compras`;
    private TIPOS_PAGO_URL = `${environment.apiUrl}/tipos-pago`;

    getAll(): Observable<PedidoCompraDto[]> {
        return this.http.get<PedidoCompraDto[]>(this.API_URL);
    }

    getById(id: number): Observable<PedidoCompraDto> {
        return this.http.get<PedidoCompraDto>(`${this.API_URL}/${id}`);
    }

    create(dto: PedidoCompraDto): Observable<PedidoCompraDto> {
        return this.http.post<PedidoCompraDto>(this.API_URL, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }

    getTiposPago(): Observable<TiposPagoDto[]> {
        return this.http.get<TiposPagoDto[]>(this.TIPOS_PAGO_URL);
    }

    // Legacy shims (keep compra-list working)
    getCompras = this.getAll.bind(this);
    createCompra(dto: any) { return this.create(dto); }
    deleteCompra(id: number) { return this.delete(id); }
}
