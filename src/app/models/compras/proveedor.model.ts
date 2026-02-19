export interface Proveedor {
    idProveedor: number;
    ruc: string;
    razonSocial: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    contacto?: string;
    estado?: boolean;
}
