import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { CreateMovimientoCajaRequest, MovimientoCajaResponse } from '../../models/venta/caja-movimiento';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovimientoCajaService {

  constructor(
    private http: HttpClient
  ) { }

  // URL base ajustada a tu Controller (@RequestMapping("/api/movimientos-caja"))
  private readonly apiUrl = `${environment.apiUrl}/api/movimientos-caja`;

  // =================================================================
  // STATE (Signals)
  // =================================================================

  // Mantenemos la lista de movimientos en memoria para acceso inmediato en la UI
  private _movimientos = signal<MovimientoCajaResponse[]>([]);

  // Exponemos la señal como lectura para la Tabla de PrimeNG
  public readonly movimientos = this._movimientos.asReadonly();

  // =================================================================
  // ACTIONS
  // =================================================================

  /**
   * Obtiene la lista de movimientos de una caja específica.
   * Endpoint: GET /api/movimientos-caja/caja/{cajaId}
   */
  listarMovimientos(cajaId: string): Observable<MovimientoCajaResponse[]> {
    return this.http.get<MovimientoCajaResponse[]>(`${this.apiUrl}/caja/${cajaId}`).pipe(
      tap((lista) => {
        // Al recibir la data, actualizamos la señal. 
        // Cualquier componente que use this.movimientos() se redibujará.
        this._movimientos.set(lista);
      })
    );
  }

  /**
   * Registra un ingreso o egreso.
   * Endpoint: POST /api/movimientos-caja
   */
  registrarMovimiento(payload: CreateMovimientoCajaRequest): Observable<MovimientoCajaResponse> {
    return this.http.post<MovimientoCajaResponse>(`${this.apiUrl}`, payload).pipe(
      tap((nuevoMovimiento) => {
        // UX PRO: Actualización Optimista (Optimistic Update)
        // Agregamos el nuevo movimiento al inicio de la lista actual sin recargar todo.
        this._movimientos.update((listaActual) => [nuevoMovimiento, ...listaActual]);
      })
    );
  }

  /**
   * (Opcional) Limpia la lista al cerrar sesión o cambiar de caja
   */
  limpiarEstado() {
    this._movimientos.set([]);
  }
}
