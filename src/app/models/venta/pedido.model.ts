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

export interface RegistrarPagoDto {
    pedidoId: string;
    monto: number;       // Vital para validar montos en backend
    metodoPago: string;
    referencia?: string; // Opcional (ej: Numero de operación Yape)
    detalleIds?: string[]; // Opcional (Si quisieras pagar solo ciertos items)
}

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
}