export interface Producto {
    id: string;
    nombre: string;
    precio: number;
    categoria: string; // 'ENTRADAS', 'FONDOS', 'BEBIDAS'
    imagen?: string;   // URL de la imagen
    stock?: number;
}