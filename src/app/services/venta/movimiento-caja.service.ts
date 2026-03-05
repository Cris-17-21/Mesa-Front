import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import {
  CreateMovimientoCajaRequest,
  MovimientoCajaResponse
} from '../../models/venta/caja-movimiento';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovimientoCajaService {

  constructor(private http: HttpClient) { }

  private readonly apiUrl = `${environment.apiUrl}/movimientos-caja`;

  // ================================================================
  // 1. STATE (Signals)
  // ================================================================

  private _movimientos = signal<MovimientoCajaResponse[]>([]);

  public readonly movimientos = this._movimientos.asReadonly();

  // ================================================================
  // 2. ACTIONS (Integración HTTP)
  // ================================================================

  listarMovimientos(
    cajaId: string
  ): void {

    this.http
      .get<MovimientoCajaResponse[]>(`${this.apiUrl}/caja/${cajaId}`)
      .subscribe((lista) => {
        this._movimientos.set(lista ?? []);
      });
  }

  consultarMovimientos(cajaId: string): Observable<MovimientoCajaResponse[]> {
    return this.http.get<MovimientoCajaResponse[]>(`${this.apiUrl}/caja/${cajaId}`);
  }

  registrarMovimiento(
    payload: CreateMovimientoCajaRequest
  ): Observable<MovimientoCajaResponse> {

    return this.http
      .post<MovimientoCajaResponse>(`${this.apiUrl}`, payload)
      .pipe(
        tap((nuevoMovimiento) => {
          this._movimientos.update((listaActual) => [
            nuevoMovimiento,
            ...listaActual
          ]);
        })
      );
  }

  historialMovimiento(inicio: string, fin: string): Observable<MovimientoCajaResponse[]> {
    return this.http.get<MovimientoCajaResponse[]>(`${this.apiUrl}/rango`, {
      params: { inicio, fin }
    });
  }

  limpiarEstado(): void {
    this._movimientos.set([]);
  }
}