import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import {
  BuscarComprobantesParams,
  ComprobanteResponse,
  GenerarComprobanteRequest,
  NotaCreditoRequest
} from '../../models/venta/facturacion.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {

  constructor(private http: HttpClient) { }

  // Base URL: /api/facturacion (Corrected to match Spring Boot backend controller)
  private readonly apiUrl = `${environment.apiUrl}/facturacion`;

  // =================================================================
  // STATE (Signals)
  // =================================================================

  // Guardamos el último comprobante generado en memoria.
  // UX: Permite reimprimir rápido sin volver a consultar al servidor.
  private _ultimoComprobante = signal<ComprobanteResponse | null>(null);

  public readonly ultimoComprobante = this._ultimoComprobante.asReadonly();

  // =================================================================
  // ACTIONS
  // =================================================================

  /**
   * Envía la solicitud para timbrar (generar XML/PDF) ante la SUNAT.
   * Endpoint: POST /api/ventas/facturacion/emitir
   * La emisión es diferida: el backend genera el comprobante localmente
   * en estado PENDIENTE_ENVIO y lo envía a SUNAT en background (30 min).
   */
  emitirComprobante(payload: GenerarComprobanteRequest): Observable<ComprobanteResponse> {
    // Mapeamos el tipo de comprobante amigable a los códigos de SUNAT que espera el backend
    const backendPayload = {
      ...payload,
      tipoComprobante: payload.tipoComprobante === 'FACTURA' ? '01'
        : payload.tipoComprobante === 'BOLETA' ? '03'
        : payload.tipoComprobante === 'NOTA_VENTA' ? '02'
        : payload.tipoComprobante
    };

    return this.http.post<ComprobanteResponse>(`${this.apiUrl}/emitir`, backendPayload).pipe(
      tap((comprobante) => {
        this._ultimoComprobante.set(comprobante);
      })
    );
  }

  /**
   * Busca comprobantes con filtros opcionales.
   * Endpoint: GET /api/ventas/facturacion/buscar?estado=&fechaDesde=&fechaHasta=&tipo=
   */
  buscarComprobantes(sucursalId: string, filtros: BuscarComprobantesParams = {}): Observable<ComprobanteResponse[]> {
    let params = new HttpParams().set('sucursalId', sucursalId);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.fechaDesde) params = params.set('fechaInicio', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaFin', filtros.fechaHasta);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);

    return this.http.get<ComprobanteResponse[]>(`${this.apiUrl}/buscar`, { params });
  }

  /**
   * Fuerza el envío inmediato de un comprobante a SUNAT (sin esperar el cron).
   * Endpoint: POST /api/ventas/facturacion/{id}/enviar
   */
  enviarASunat(comprobanteId: string): Observable<ComprobanteResponse> {
    return this.http.post<ComprobanteResponse>(`${this.apiUrl}/comprobantes/${comprobanteId}/enviar-inmediato`, {});
  }

  /**
   * Configura o actualiza el correlativo inicial de una serie en el facturador.
   * Endpoint: POST /api/facturacion/series/configurar
   */
  configurarSeries(sucursalId: string, tipoDoc: string, serie: string, correlativo: number): Observable<void> {
    const params = new HttpParams()
      .set('sucursalId', sucursalId)
      .set('tipoDoc', tipoDoc)
      .set('serie', serie)
      .set('correlativo', correlativo.toString());
    return this.http.post<void>(`${this.apiUrl}/series/configurar`, {}, { params });
  }

  /**
   * Obtiene la lista de series configuradas por sucursal en el facturador.
   * Endpoint: GET /api/facturacion/series
   */
  obtenerSeries(sucursalId: string): Observable<any[]> {
    const params = new HttpParams().set('sucursalId', sucursalId);
    return this.http.get<any[]>(`${this.apiUrl}/series`, { params });
  }

  descargarArchivo(id: string, tipo: string, formato?: string): Observable<Blob> {
    let url = `${this.apiUrl}/comprobantes/${id}/descargar/${tipo}`;
    if (formato) {
      url += `?formato=${formato}`;
    }
    return this.http.get(url, { responseType: 'blob' });
  }

  eliminarComprobante(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comprobantes/${id}`);
  }

  emitirNotaCredito(dto: NotaCreditoRequest): Observable<ComprobanteResponse> {
    return this.http.post<ComprobanteResponse>(`${this.apiUrl}/nota-credito`, dto);
  }

  // =================================================================
  // HELPERS (Utilidades de UX)
  // =================================================================

  /**
   * Abre el PDF del último comprobante en una nueva pestaña.
   * Útil para el botón "Imprimir" del modal de éxito.
   */
  abrirPdfEnNuevaPestana(urlPdf?: string): void {
    const url = urlPdf || this._ultimoComprobante()?.archivoPdf;

    if (url) {
      window.open(url, '_blank', 'noopener');
    } else {
      console.warn('No hay URL de PDF disponible para imprimir.');
    }
  }

  /**
   * Limpia el estado (por si cambias de cliente y no quieres mezclar datos)
   */
  limpiarEstado() {
    this._ultimoComprobante.set(null);
  }
}
