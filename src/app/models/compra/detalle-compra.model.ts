export interface DetalleCompra {
    id?: number;
    productoId: number;
    productoNombre?: string; // Para mostrar en la tabla sin consultar otra vez
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}
