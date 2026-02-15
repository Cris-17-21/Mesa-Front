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
  private readonly apiUrl = `${environment.apiUrl}/api/facturacion`;

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
    return this.http.post<ComprobanteResponse>(`${this.apiUrl}/emitir`, payload).pipe(
      tap((comprobante) => {
        // Almacenamos el resultado.
        this._ultimoComprobante.set(comprobante);

        // UX Automática: Podríamos disparar la impresión aquí, 
        // pero mejor dejamos que el componente decida cuándo abrir la ventana.
      })
    );
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
