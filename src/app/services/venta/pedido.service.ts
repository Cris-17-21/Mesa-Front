import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { PedidoDetalleRequestDto, PedidoRequestDto, PedidoResponseDto, PedidoResumenDto } from '../../models/venta/pedido.model';
import { Observable, tap } from 'rxjs';
import { UnionMesa } from '../../models/maestro/mesa.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  constructor(private http: HttpClient) { }

  private readonly apiUrl = `${environment.apiUrl}/api/ventas/pedidos`;

  // =================================================================
  // 1. STATE (Signals) - La única fuente de verdad
  // =================================================================

  // Lista ligera para el "Mapa de Mesas" (Solo resumen: ID, Mesa, Estado, Total)
  private _pedidosActivos = signal<PedidoResumenDto[]>([]);

  // El pedido completo que se está editando en la pantalla de "Comanda"
  private _pedidoSeleccionado = signal<PedidoResponseDto | null>(null);

  // =================================================================
  // 2. COMPUTED (Selectores)
  // =================================================================

  public readonly pedidosActivos = this._pedidosActivos.asReadonly();
  public readonly pedidoSeleccionado = this._pedidoSeleccionado.asReadonly();

  /**
   * Computed: Calcula el total del pedido seleccionado automáticamente.
   * Útil para mostrarlo en el botón gigante de "Cobrar"
   */
  public readonly totalPedidoActual = computed(() =>
    this._pedidoSeleccionado()?.totalFinal || 0
  );

  /**
   * Computed: Devuelve los items (detalles) del pedido actual.
   * Si es null, devuelve array vacío.
   */
  public readonly itemsPedidoActual = computed(() =>
    this._pedidoSeleccionado()?.detalles || []
  );

  // =================================================================
  // 3. ACTIONS (Métodos HTTP)
  // =================================================================

  /**
   * Crea un pedido nuevo (Mesa nueva o Delivery).
   * POST /api/ventas/pedidos
   */
  crearPedido(dto: PedidoRequestDto): Observable<PedidoResponseDto> {
    return this.http.post<PedidoResponseDto>(this.apiUrl, dto).pipe(
      tap((nuevoPedido) => {
        // Al crear, lo establecemos como seleccionado inmediatamente
        this._pedidoSeleccionado.set(nuevoPedido);
        // Y actualizamos la lista de activos (añadiendo un resumen ficticio o recargando)
        this.recargarListaActivos(dto.sucursalId);
      })
    );
  }

  /**
   * Obtiene todos los pedidos activos para pintar el mapa de mesas.
   * GET /api/ventas/pedidos/activos/{sucursalId}
   */
  listarActivos(sucursalId: string): Observable<PedidoResumenDto[]> {
    return this.http.get<PedidoResumenDto[]>(`${this.apiUrl}/activos/${sucursalId}`).pipe(
      tap((lista) => this._pedidosActivos.set(lista))
    );
  }

  /**
   * Carga el detalle completo de una mesa para editarla (Comanda).
   * GET /api/ventas/pedidos/{id}
   */
  seleccionarPedido(id: string): Observable<PedidoResponseDto> {
    // Primero limpiamos el seleccionado anterior para evitar "flasheos" de datos viejos
    this._pedidoSeleccionado.set(null);

    return this.http.get<PedidoResponseDto>(`${this.apiUrl}/${id}`).pipe(
      tap((pedido) => this._pedidoSeleccionado.set(pedido))
    );
  }

  /**
   * Agrega platos/bebidas a una mesa existente.
   * PATCH /api/ventas/pedidos/{id}/detalles
   */
  agregarDetalles(pedidoId: string, items: PedidoDetalleRequestDto[]): Observable<PedidoResponseDto> {
    return this.http.patch<PedidoResponseDto>(`${this.apiUrl}/${pedidoId}/detalles`, items).pipe(
      tap((pedidoActualizado) => {
        // Actualizamos la señal: La UI de la comanda se repinta sola con los nuevos items
        this._pedidoSeleccionado.set(pedidoActualizado);
      })
    );
  }

  /**
   * Une dos mesas.
   * POST /api/ventas/pedidos/unir-mesas
   */
  unirMesas(dto: UnionMesa, sucursalId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/unir-mesas`, dto).pipe(
      tap(() => {
        // Al unir mesas, IDs cambian y mesas desaparecen. Es obligatorio recargar la lista.
        this.listarActivos(sucursalId).subscribe();
        this._pedidoSeleccionado.set(null); // Limpiamos selección por seguridad
      })
    );
  }

  /**
   * Paga la cuenta (Cierre simple).
   * POST /api/ventas/pedidos/{id}/pagar?metodoPago=XXX
   */
  registrarPago(pedidoId: string, metodoPago: string, sucursalId: string): Observable<void> {
    // Usamos HttpParams para el @RequestParam
    const params = new HttpParams().set('metodoPago', metodoPago);

    return this.http.post<void>(`${this.apiUrl}/${pedidoId}/pagar`, null, { params }).pipe(
      tap(() => {
        // Éxito: Quitamos el pedido de la lista de activos localmente (Optimistic UI)
        this._pedidosActivos.update(lista => lista.filter(p => p.id !== pedidoId));

        // Limpiamos la selección
        this._pedidoSeleccionado.set(null);
      })
    );
  }

  // --- Helper Privado ---
  private recargarListaActivos(sucursalId: string) {
    this.listarActivos(sucursalId).subscribe();
  }
}
