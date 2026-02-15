/**
 * Tipado estricto para evitar errores de "dedo" al asignar el tipo.
 * Coincide con tu Enum de Java.
 */
export type TipoComprobante = 'BOLETA' | 'FACTURA';

/**
 * Payload para solicitar la creación de una factura/boleta.
 * Corresponde a: FacturaRequestDto
 */
export interface GenerarComprobanteRequest {
    pedidoId: string;
    tipoComprobante: TipoComprobante;

    /** * RUC si es Factura, DNI si es Boleta (o Apellidos si no hay DNI).
     * Nota: Validar longitud (11 vs 8) en el formulario antes de enviar.
     */
    rucApellidos: string;

    razonSocialNombres: string;
    direccion: string; // Opcional en boletas rápidas, obligatorio en Facturas
}

/**
 * Respuesta del servidor con el comprobante generado.
 * Corresponde a: FacturacionComprobanteDto
 */
export interface ComprobanteResponse {
    id: string;
    tipoComprobante: TipoComprobante;
    serie: string;       // Ej: "F001"
    correlativo: string; // Ej: "00000234"
    rucEmisor: string;

    /** Fecha en formato ISO string (desde LocalDateTime) */
    fechaEmision: string;

    totalVenta: number;  // BigDecimal -> number
    pedidoId: string;

    /** * URL pública o Base64 del XML firmado (para descarga)
     */
    archivoXml: string;

    /** * URL pública o Base64 del PDF (para impresión/visualización)
     */
    archivoPdf: string;
}