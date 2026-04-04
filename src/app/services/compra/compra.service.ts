import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, tap, catchError } from 'rxjs';
import { environment } from '../../core/environment/environment';
import { AuthService } from '../../core/auth/auth.service';

export interface DetalleRecepcion {
    idDetallePedido: number;
    cantidadRecibida: number;
}

export interface RecepcionPedidoRequest {
    numeroGuiaRemision?: string;
    observaciones?: string;
    detalles: DetalleRecepcion[];
}

export interface DetallePedidoCompraDto {
    idDetallePedido?: number;
    idProducto: number;
    nombreProducto?: string;
    cantidadPedida: number;
    costoUnitario: number;
    subtotalLinea: number;
    esProductoNuevo?: boolean;
    idCategoriaNuevoProducto?: number;
}

export interface PedidoCompraDto {
    idPedidoCompra?: number;
    idUsuario?: string;
    sucursalId?: string;
    idProveedor: number;
    razonSocialProveedor?: string;
    fechaPedido?: string | null;
    fechaEntregaEsperada?: string | null;
    idTipoPago?: number | null;
    nombreTipoPago?: string;
    referencia?: string;
    observaciones?: string;
    estadoPedido?: string;
    totalPedido?: number;
    aplicaIgv: boolean;
    esCompraSimple?: boolean;
    nombreProveedorInformal?: string;
    detalles: DetallePedidoCompraDto[];
}

export interface TiposPagoDto {
    idTipoPago: number;
    tipoPago: string;
}

@Injectable({ providedIn: 'root' })
export class CompraService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private API_URL = `${environment.apiUrl}/compras`;
    private TIPOS_PAGO_URL = `${environment.apiUrl}/tipos-pago`;

    getAll(): Observable<PedidoCompraDto[]> {
        const sucursalId = this.authService.getSucursalId();
        return this.http.get<PedidoCompraDto[]>(`${this.API_URL}/sucursal/${sucursalId}`);
    }

    getById(id: number): Observable<PedidoCompraDto> {
        return this.http.get<PedidoCompraDto>(`${this.API_URL}/${id}`);
    }

    create(dto: PedidoCompraDto): Observable<PedidoCompraDto> {
        return this.http.post<PedidoCompraDto>(this.API_URL, dto).pipe(
            catchError(err => {
                alert('Detalle de error 400 del Backend:\n' + JSON.stringify(err.error, null, 2));
                throw err;
            })
        );
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }

    getTiposPago(): Observable<TiposPagoDto[]> {
        return this.http.get<TiposPagoDto[]>(this.TIPOS_PAGO_URL);
    }

    registrarRecepcion(id: number, request: RecepcionPedidoRequest): Observable<PedidoCompraDto> {
        return this.http.post<PedidoCompraDto>(`${this.API_URL}/${id}/recepciones`, request);
    }

    // Legacy shims (keep compra-list working)
    getCompras = this.getAll.bind(this);
    createCompra(dto: any) { return this.create(dto); }
    deleteCompra(id: number) { return this.delete(id); }
}
