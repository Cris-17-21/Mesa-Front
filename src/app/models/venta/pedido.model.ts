export interface PedidoRequestDto {
    tipoEntrega: string; // 'MESA' | 'DELIVERY' | 'RECOJO'
    sucursalId: string;
    mesaId: string;
    usuarioId: string;
    detalles: PedidoDetalleRequestDto[];
}

export interface PedidoDetalleRequestDto {
    productoId: string;
    cantidad: number;
    observaciones?: string;
}

export interface PedidoResponseDto {
    id: string;
    codigoPedido: string;
    estado: string;
    tipoEntrega: string;
    totalFinal: number;
    fechaCreacion: string;
    nombreCliente: string;
    codigoMesa: string;
    detalles: PedidoDetalleResponseDto[];
    sucursalId: string;
}

export interface PedidoDetalleResponseDto {
    id: string;
    productoNombre: string;
    cantidad: number;
    cantidadPagada: number; // NUEVO: Vital para separar cuentas
    precioUnitario: number;
    totalLinea: number;
    estadoPreparacion: string;
    estadoPago: string; // 'PENDIENTE' | 'PARCIAL' | 'PAGADO'
    observaciones?: string;
}

export interface RegistrarPagoDto {
    pedidoId: string;
    monto: number;
    metodoPago: string;
    referencia: string;
    detalleIds: string[];
}

export interface SepararCuentaDto {
    pedidoOrigenId: string;
    detallesIds: string[];
    nuevaMesaId?: string; // Opcional, si se mueven a otra mesa
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
}
