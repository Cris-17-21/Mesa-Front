import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import {
  AbrirCajaDto,
  CajaResumenDto,
  CajaTurnoDto,
  CerrarCajaDto
} from '../../models/venta/caja.model';
import { catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  constructor(private http: HttpClient) { }

  private readonly apiUrl = `${environment.apiUrl}/ventas/caja`;

  // ================================================================
  // 1. STATE (Signals) - Única fuente de verdad en el frontend
  // ================================================================

  private _cajaActiva = signal<CajaTurnoDto | null>(null);
  private _resumenFinanciero = signal<CajaResumenDto | null>(null);
  private _historialTurnos = signal<CajaTurnoDto[]>([]);
  loading = signal<boolean>(false);

  // ================================================================
  // 2. SELECTORES (ReadOnly + Computed)
  // ================================================================

  public readonly cajaActiva = this._cajaActiva.asReadonly();
  public readonly resumenFinanciero = this._resumenFinanciero.asReadonly();
  public readonly historialTurnos = this._historialTurnos.asReadonly();

  isCajaAbierta = computed(() => {
    const caja = this.cajaActiva();
    return !!caja && (caja.estado === 'ABIERTA' || caja.estado === 'ABIERTO');
  });

  public readonly cajaIdActual = computed(() =>
    this._cajaActiva()?.id ?? ''
  );

  // ================================================================
  // 3. ACTIONS (Integración HTTP)
  // ================================================================

  /**
   * Verifica si hay una caja abierta en la sucursal.
   * La caja es compartida por todos los usuarios de la misma sucursal.
   */
  verificarEstadoCaja(
    sucursalId: string,
    usuarioId: string
  ): void {

    this.loading.set(true);

    this.http
      .get<CajaTurnoDto>(`${this.apiUrl}/activa/${sucursalId}/${usuarioId}`)
      .pipe(
        catchError(() => of(null))
      )
      .subscribe((caja) => {
        this._cajaActiva.set(caja);
        this.loading.set(false);
      });
  }

  abrirCaja(payload: AbrirCajaDto): Observable<CajaTurnoDto> {
    return this.http
      .post<CajaTurnoDto>(`${this.apiUrl}/abrir`, payload)
      .pipe(
        tap((nuevaCaja) => {
          this._cajaActiva.set(nuevaCaja);
        })
      );
  }

  obtenerArqueo(cajaId: string): void {
    this.http
      .get<CajaResumenDto>(`${this.apiUrl}/arqueo/${cajaId}`)
      .subscribe((resumen) => {
        this._resumenFinanciero.set(resumen);
      });
  }

  obtenerResumenArqueo(cajaId: string): Observable<CajaResumenDto> {
    return this.http.get<CajaResumenDto>(`${this.apiUrl}/arqueo/${cajaId}`);
  }

  cerrarCaja(payload: CerrarCajaDto): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/cerrar`, payload)
      .pipe(
        tap(() => {
          this._cajaActiva.set(null);
          this._resumenFinanciero.set(null);
        })
      );
  }

  obtenerHistorial(sucursalId: string): void {
    this.http.get<CajaTurnoDto[]>(`${this.apiUrl}/historial/${sucursalId}`)
      .subscribe(historial => this._historialTurnos.set(historial));
  }
}