import { DetalleCompra } from "./detalle-compra.model";

export interface Compra {
    id?: number;
    proveedorId: number;
    proveedorNombre?: string; // Opcional, para facilitar visualización
    fecha: string; // ISO string
    nroComprobante: string;
    total: number;
    estado: 'PENDIENTE' | 'PAGADO' | 'ANULADO';
    detalles: DetalleCompra[];
}
