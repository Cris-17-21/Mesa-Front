export interface Proveedor {
    id: number;
    ruc: string;
    razonSocial: string;
    direccion: string;
    telefono: string;
    correo: string;
    contacto: string;
    estado: string;
}

export interface CreateProveedorDto {
    ruc: string;
    razonSocial: string;
    direccion: string;
    telefono: string;
    correo: string;
    contacto: string;
}

export interface UpdateProveedorDto {
    ruc?: string;
    razonSocial?: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    contacto?: string;
    estado?: string;
}
