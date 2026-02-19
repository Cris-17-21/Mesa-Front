export interface Producto {
    idProducto: number;
    nombreProducto: string;
    descripcion?: string;
    precioVenta: number;
    costoCompra?: number;
    idCategoria: number;
    nombreCategoria?: string;
    idProveedor?: number;
    razonSocialProveedor?: string;
    tipo?: string;
    pesoGramos?: number;
    estado: boolean;
    imagen?: string;
}