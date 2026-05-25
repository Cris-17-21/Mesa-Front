// --- REQUEST DTOs (Lo que envías al Backend) ---

export interface PedidoRequestDto {
    tipoEntrega: string;
    sucursalId: string;
    mesaId?: string;
    usuarioId: string;
    detalles: PedidoDetalleRequestDto[];
    // Campos para Delivery
    nombreCliente?: string;
    telefono?: string;
    direccion?: string;
}

export interface PedidoDetalleRequestDto {
    productoId: string;
    cantidad: number;
    observaciones?: string;
}

/**
 * Un pago individual en un cobro mixto.
 * El backend espera un array de estos en POST /{pedidoId}/pagar
 */
export interface PagoMixtoItem {
    medioPagoId: string;  // UUID del MedioPago (EFECTIVO, YAPE, TARJETA, etc.)
    monto: number;
}

/**
 * Body del endpoint POST /api/ventas/pedidos/{pedidoId}/pagar
 */
export type RegistrarPagosMixtosDto = PagoMixtoItem[];

export interface SepararCuentaRequestDto {
    pedidoOrigenId: string;
    items: {
        detalleId: string;
        cantidad: number;
    }[];
}

export interface UnionMesaRequestDto {
    idPrincipal: string;
    idsSecundarios: string[];
}

// --- RESPONSE DTOs (Lo que recibes) ---

export interface PedidoResponseDto {
    id: string;
    codigoPedido: string;
    estado: string;
    tipoEntrega: string;
    totalFinal: number;
    fechaCreacion: string;
    nombreCliente: string;
    telefono?: string; // Delivery
    direccion?: string; // Delivery
    codigoMesa: string;
    detalles: PedidoDetalleResponseDto[];
    sucursalId: string;
}

export interface PedidoDetalleResponseDto {
    id: string; // Este es el detalleId
    productoNombre: string;
    cantidad: number;
    cantidadPagada: number;
    precioUnitario: number;
    totalLinea: number;
    estadoPreparacion: string;
    estadoPago: string;
    observaciones?: string;
}

export interface PedidoResumenDto {
    id: string;
    codigoPedido: string;
    estado: string;
    tipoEntrega: string;
    totalFinal: number;
    fechaCreacion: string;
    nombreCliente: string;
    codigoMesa: string;
    mesaId: string;
}

// --- MODELOS AUXILIARES (Frontend) ---

export interface CartItem {
    productoId: string; // Ojo: Cambié a string si tus IDs son UUIDs
    nombre: string;
    precio: number;
    cantidad: number;
    observaciones: string;
    categoria?: string;
}