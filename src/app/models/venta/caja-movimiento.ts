// Definimos un tipo unión para string literals. 
// Esto ayuda al autocompletado en VS Code y evita errores de tipeo.
export type TipoMovimiento = 'INGRESO' | 'EGRESO';

/**
 * Mapeo del MovimientoCajaDto (Si lo usas para alguna lógica interna)
 */
export interface MovimientoCaja {
    cajaId: string;
    tipo: TipoMovimiento;
    monto: number; // BigDecimal en Java -> number en TS
    descripcion: string;
    usuarioId: string;
}

/**
 * Payload para crear un nuevo movimiento
 * Corresponde a: MovivmientoCajaRequest
 */
export interface CreateMovimientoCajaRequest {
    cajaTurnoId: string;
    monto: number;
    descripcion: string;
    tipo: TipoMovimiento;
}

/**
 * Data para visualizar en tablas/listas
 * Corresponde a: MovimientoCajaResponseDto
 */
export interface MovimientoCajaResponse {
    id: string;
    tipo: TipoMovimiento;
    monto: number;
    descripcion: string;
    // LocalDateTime viene como string ISO-8601 en JSON (ej: "2023-10-05T14:30:00")
    fecha: string;
    usuarioNombre: string;
}