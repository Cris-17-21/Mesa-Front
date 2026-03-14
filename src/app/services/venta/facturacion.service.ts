import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { ComprobanteResponse, GenerarComprobanteRequest } from '../../models/venta/facturacion.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {

  constructor(private http: HttpClient) { }

  // Base URL: /api/facturacion
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
   * Envía la solicitud para timbrar (generar XML/PDF) ante la SUNAT/Hacienda.
   * Endpoint: POST /api/facturacion/emitir
   */
  emitirComprobante(payload: GenerarComprobanteRequest): Observable<ComprobanteResponse> {
    // Mapeamos el tipo de comprobante amigable a los códigos de SUNAT que espera el backend
    const backendPayload = {
      ...payload,
      tipoComprobante: payload.tipoComprobante === 'FACTURA' ? '01' : '03'
    };

    return this.http.post<ComprobanteResponse>(`${this.apiUrl}/emitir`, backendPayload).pipe(
      tap((comprobante) => {
        this._ultimoComprobante.set(comprobante);
      })
    );
  }

  /**
   * Lista los comprobantes emitidos por sucursal.
   * Endpoint: GET /api/facturacion/sucursal/{sucursalId}
   */
  listarComprobantes(sucursalId: string): Observable<ComprobanteResponse[]> {
    return this.http.get<ComprobanteResponse[]>(`${this.apiUrl}/sucursal/${sucursalId}`);
  }

  // =================================================================
  // HELPERS (Utilidades de UX)
  // =================================================================

  /**
   * Abre el PDF del último comprobante en una nueva pestaña.
   * Útil para el botón "Imprimir" del modal de éxito.
   */
  abrirPdfEnNuevaPestana(urlPdf?: string): void {
    // Usamos el del parámetro o el que tenemos en memoria
    const url = urlPdf || this._ultimoComprobante()?.archivoPdf;

    if (url) {
      // '_blank' abre nueva pestaña. 'noopener' es por seguridad.
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
