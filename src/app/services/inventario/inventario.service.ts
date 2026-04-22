import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { Observable } from 'rxjs';

export interface InventarioDto {
  idProducto: number;
  nombreProducto: string;
  costoCompra: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  idProveedor: number;
  nombreProveedor: string;
}

export interface MovimientoRequest {
  idProducto: number;
  sucursalId: string;
  tipoMovimiento: string; // ENTRADA | SALIDA
  cantidad: number;
  motivo: string;
  usuarioId: string;
  comprobante: string;
}

export interface MovimientoInventarioDto {
  idMovimiento: number;
  idProducto: number;
  nombreProducto: string;
  sucursalId: string;
  tipoMovimiento: string;
  cantidad: number;
  motivo: string;
  fechaMovimiento: string;
  usuarioId: string;
  comprobante: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private http = inject(HttpClient);
  private url = environment.apiUrl + '/inventario';

  constructor() { }

  listarProductosInventario(sucursalId: string): Observable<InventarioDto[]> {
    return this.http.get<InventarioDto[]>(`${this.url}/productos/sucursal/${sucursalId}`);
  }

  registrarMovimiento(request: MovimientoRequest): Observable<MovimientoInventarioDto> {
    return this.http.post<MovimientoInventarioDto>(`${this.url}/movimientos`, request);
  }

  obtenerHistorialMovimientos(sucursalId: string): Observable<MovimientoInventarioDto[]> {
    return this.http.get<MovimientoInventarioDto[]>(`${this.url}/movimientos/sucursal/${sucursalId}`);
  }

  obtenerHistorialMovimientosPorProducto(idProducto: number, sucursalId: string): Observable<MovimientoInventarioDto[]> {
    return this.http.get<MovimientoInventarioDto[]>(`${this.url}/movimientos/producto/${idProducto}/sucursal/${sucursalId}`);
  }
}
