export interface Proveedor {
    idProveedor: number;
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    direccion: string;
    telefono: string;
    correo?: string;
    estado?: string;
}

export interface CreateProveedorDto {
    ruc: string;
    razonSocial: string;
    direccion: string;
    telefono: string;
    correo: string
}

export interface UpdateProveedorDto {
    ruc?: string;
    razonSocial?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    estado?: string;
}
