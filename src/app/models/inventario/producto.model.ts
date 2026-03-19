export interface Producto {
    idProducto: number;
    nombreProducto: string;
    precioVenta: number;
    costoCompra?: number;
    stock: number;
    fechaRegistro?: string;
    idCategoria: number;
    idTipos?: number[];
    nombreCategoria?: string;
    idProveedor: number;
    razonSocialProveedor?: string;
    imagen?: string;
    estado: boolean;
    tipo?: string;
    
    // Platos
    esPlato?: boolean;
    horarioDisponible?: string;
    fechaDisponible?: string;
}

export interface PlatoSalesHistory {
    idProducto: number;
    nombrePlato: string;
    nombreCategoria?: string;
    horario: string;
    cantidadVendida: number;
    precioVenta: number;
}