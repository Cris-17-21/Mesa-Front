import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { AbrirCajaDto, CajaResumenDto, CajaTurnoDto, CerrarCajaDto } from '../../models/venta/caja.model';
import { catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  constructor(
    private http: HttpClient
  ) { }

  // URL base ajustada a tu Controller (@RequestMapping("/api/ventas/caja"))
  private readonly apiUrl = `${environment.apiUrl}/ventas/caja`;

  // =================================================================
  // 1. STATE (Signals) - La única fuente de verdad
  // =================================================================

  // Almacena la info de la caja actual (o null si no hay turno abierto)
  private _cajaActiva = signal<CajaTurnoDto | null>(null);

  // Almacena el resumen financiero (arqueo) para el dashboard
  private _resumenFinanciero = signal<CajaResumenDto | null>(null);

  // =================================================================
  // 2. COMPUTED (Selectores) - Para usar en tus Templates
  // =================================================================

  // Exponemos las señales como ReadOnly para evitar modificaciones externas directas
  public readonly cajaActiva = this._cajaActiva.asReadonly();
  public readonly resumenFinanciero = this._resumenFinanciero.asReadonly();

  /**
   * Computed: Devuelve true si hay una caja cargada y su estado es 'ABIERTO'.
   * Úsalo en el Guard de rutas o para deshabilitar botones de venta.
   */
  public readonly isCajaAbierta = computed(() => {
    const estado = this._cajaActiva()?.estado;
    return estado === 'ABIERTA' || estado === 'ABIERTO';
  });

  /**
   * Computed: Obtiene el ID de la caja actual de forma rápida
   */
  public readonly cajaIdActual = computed(() =>
    this._cajaActiva()?.id || ''
  );

  // =================================================================
  // 3. ACTIONS (Métodos HTTP)
  // =================================================================

  /**
   * Verifica si el usuario tiene una caja abierta al iniciar sesión o recargar página.
   * Endpoint: GET /activa/{sucursalId}/{usuarioId}
   */
  verificarEstadoCaja(sucursalId: string, usuarioId: string): Observable<CajaTurnoDto | null> {
    // VOLVEMOS A LA RUTA CON BARRAS '/' QUE ES LA QUE TU BACKEND ACEPTA
    return this.http.get<CajaTurnoDto>(`${this.apiUrl}/activa/${sucursalId}/${usuarioId}`).pipe(
      tap((caja) => {
        // Si el backend devuelve 204 (No Content), Angular pasa 'caja' como null.
        // Si devuelve 200 (OK), 'caja' es el objeto JSON.

        if (caja) {
          console.log('✅ Caja activa encontrada (RECUPERADA):', caja);
          this._cajaActiva.set(caja); // Esto actualizará la vista a "Cerrar Caja"
        } else {
          console.log('ℹ️ No hay caja activa (Backend devolvió 204/null)');
          this._cajaActiva.set(null); // Esto mostrará "Abrir Caja"
        }
      }),
      catchError((err) => {
        console.warn('⚠️ Error consultando estado de caja:', err);
        // Si hay error, asumimos cerrado para no romper la app
        this._cajaActiva.set(null);
        return of(null);
      })
    );
  }

  /**
   * Abre un nuevo turno de caja.
   * Endpoint: POST /abrir
   */
  abrirCaja(payload: AbrirCajaDto): Observable<CajaTurnoDto> {
    return this.http.post<CajaTurnoDto>(`${this.apiUrl}/abrir`, payload).pipe(
      tap((nuevaCaja) => {
        // Actualizamos inmediatamente el estado global
        this._cajaActiva.set(nuevaCaja);
      })
    );
  }

  /**
   * Obtiene los números para el dashboard (Arqueo).
   * Endpoint: GET /arqueo/{cajaId}
   */
  obtenerArqueo(cajaId: string): Observable<CajaResumenDto> {
    return this.http.get<CajaResumenDto>(`${this.apiUrl}/arqueo/${cajaId}`).pipe(
      tap((resumen) => {
        this._resumenFinanciero.set(resumen);
      })
    );
  }

  /**
   * Cierra la caja actual.
   * Endpoint: POST /cerrar
   */
  cerrarCaja(payload: CerrarCajaDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cerrar`, payload).pipe(
      tap(() => {
        // Opción A: Limpiar todo (Usuario debe abrir nueva caja)
        this._cajaActiva.set(null);
        this._resumenFinanciero.set(null);

        // Opción B (Si quieres mostrar el resumen de cierre):
        // Podrías mantener el objeto pero cambiarle el estado a 'CERRADO'
        // this._cajaActiva.update(c => c ? { ...c, estado: 'CERRADO' } : null);
      })
    );
  }
}
