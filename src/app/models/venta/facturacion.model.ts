/**
 * Tipado estricto para evitar errores de "dedo" al asignar el tipo.
 * Coincide con tu Enum de Java.
 */
export type TipoComprobante = 'BOLETA' | 'FACTURA' | '01' | '03';

/**
 * Estado del comprobante ante SUNAT.
 */
export type EstadoSunat = 'PENDIENTE_ENVIO' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ACEPTADO_CON_OBSERVACIONES';

/**
 * Payload para solicitar la creación de una factura/boleta.
 * Corresponde a: FacturaRequestDto
 */
export interface GenerarComprobanteRequest {
    pedidoId: string;
    tipoComprobante: TipoComprobante;

    /**
     * RUC si es Factura (11 dígitos), DNI si es Boleta (8 dígitos).
     * Si el cliente ya está asignado al pedido, puede omitirse.
     */
    rucApellidos?: string;

    razonSocialNombres?: string;
    direccion?: string;

    /** Fecha de emisión ISO (opcional, para emisión retroactiva ±2 días) */
    fechaEmision?: string;
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

    /** Estado ante SUNAT: PENDIENTE_ENVIO, ACEPTADO, RECHAZADO, etc. */
    estadoSunat: EstadoSunat;

    /** URL pública o ruta del XML firmado (para descarga) */
    archivoXml?: string;

    /** URL pública o ruta del PDF (para impresión/visualización) */
    archivoPdf?: string;
}

/**
 * Parámetros de búsqueda para el endpoint GET /ventas/facturacion/buscar
 */
export interface BuscarComprobantesParams {
    estado?: EstadoSunat;
    fechaDesde?: string; // ISO date: "2025-01-01"
    fechaHasta?: string; // ISO date: "2025-12-31"
    tipo?: '01' | '03' | '02'; // 01=Factura, 03=Boleta, 02=Nota de Venta
}