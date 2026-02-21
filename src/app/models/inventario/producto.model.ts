export interface Producto {
    idProducto: number;
    nombreProducto: string;
    precioVenta: number;
    costoCompra?: number;
    stock: number;
    idCategoria: number;
    idTipos?: number[];
    nombreCategoria?: string;
    idProveedor: number;
    razonSocialProveedor?: string;
    imagen?: string;
    estado: boolean;
}