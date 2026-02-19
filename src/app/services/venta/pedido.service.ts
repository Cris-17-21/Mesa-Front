import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import {
  PedidoRequestDto,
  PedidoResponseDto,
  PedidoResumenDto,
  PedidoDetalleRequestDto,
  SepararCuentaRequestDto,
  UnionMesaRequestDto // Asegúrate de importar esto
} from '../../models/venta/pedido.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  constructor(private http: HttpClient) { }

  private readonly apiUrl = `${environment.apiUrl}/ventas/pedidos`;

  // =================================================================
  // 1. STATE & COMPUTED
  // =================================================================
  private _pedidosActivos = signal<PedidoResumenDto[]>([]);
  private _pedidoSeleccionado = signal<PedidoResponseDto | null>(null);

  public readonly pedidosActivos = this._pedidosActivos.asReadonly();
  public readonly pedidoSeleccionado = this._pedidoSeleccionado.asReadonly();

  public readonly totalPedidoActual = computed(() =>
    this._pedidoSeleccionado()?.totalFinal || 0
  );

  public readonly itemsPedidoActual = computed(() =>
    this._pedidoSeleccionado()?.detalles || []
  );

  // =================================================================
  // 2. ACTIONS
  // =================================================================

  crearPedido(dto: PedidoRequestDto): Observable<PedidoResponseDto> {
    return this.http.post<PedidoResponseDto>(this.apiUrl, dto).pipe(
      tap((nuevoPedido) => {
        this._pedidoSeleccionado.set(nuevoPedido);
        this.recargarListaActivos(dto.sucursalId);
      })
    );
  }

  listarActivos(sucursalId: string): Observable<PedidoResumenDto[]> {
    return this.http.get<PedidoResumenDto[]>(`${this.apiUrl}/activos/${sucursalId}`).pipe(
      tap((lista) => this._pedidosActivos.set(lista))
    );
  }

  seleccionarPedido(id: string): Observable<PedidoResponseDto> {
    this._pedidoSeleccionado.set(null); // Limpiar previo
    return this.http.get<PedidoResponseDto>(`${this.apiUrl}/${id}`).pipe(
      tap((pedido) => this._pedidoSeleccionado.set(pedido))
    );
  }

  agregarDetalles(pedidoId: string, items: PedidoDetalleRequestDto[]): Observable<PedidoResponseDto> {
    return this.http.patch<PedidoResponseDto>(`${this.apiUrl}/${pedidoId}/detalles`, items).pipe(
      tap((pedidoActualizado) => {
        this._pedidoSeleccionado.set(pedidoActualizado);
      })
    );
  }

  /**
   * ESTE FALTABA: Separa items a una nueva cuenta.
   * POST /api/ventas/pedidos/separar-cuenta
   */
  separarCuenta(dto: SepararCuentaRequestDto): Observable<PedidoResponseDto> {
    return this.http.post<PedidoResponseDto>(`${this.apiUrl}/separar-cuenta`, dto).pipe(
      tap(() => {
        // Al separar, el pedido original cambia (menos items), hay que recargarlo
        // Ojo: dto.pedidoOrigenId es el pedido actual
        this.seleccionarPedido(dto.pedidoOrigenId).subscribe();
      })
    );
  }

  /**
   * Unir dos mesas.
   */
  unirMesas(dto: UnionMesaRequestDto, sucursalId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/unir-mesas`, dto).pipe(
      tap(() => {
        this.recargarListaActivos(sucursalId);
        this._pedidoSeleccionado.set(null);
      })
    );
  }

  /**
   * Registrar Pago (Cierre).
   * Nota: Si decides usar el DTO completo en el backend, cambia null por el objeto body.
   */
  registrarPago(pedidoId: string, metodoPago: string, sucursalId: string): Observable<void> {
    const params = new HttpParams().set('metodoPago', metodoPago);

    return this.http.post<void>(`${this.apiUrl}/${pedidoId}/pagar`, null, { params }).pipe(
      tap(() => {
        // Optimistic UI: Remover de la lista activa
        this._pedidosActivos.update(lista => lista.filter(p => p.id !== pedidoId));
        this._pedidoSeleccionado.set(null);
      })
    );
  }

  // --- Helpers ---
  private recargarListaActivos(sucursalId: string) {
    if (sucursalId) {
      this.listarActivos(sucursalId).subscribe();
    }
  }
}