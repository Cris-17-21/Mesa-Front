
// MODELO DE CLIENTE
export interface Cliente {
    id: string,
    tipoDocumento: string,
    numeroDocumento: string,
    nombreRazonSocial: string,
    direccion: string,
    correo: string,
    telefono: string,
    isActive: boolean
}

// CREATE DTO
export type CreateClienteDto = Omit<Cliente, 'id' | 'tipoDocumento' | 'isActive'> & {
    empresaId: string;
    tipoDocumentoId: string;
}

// UPDATE DTO
export type UpdateClienteDto = Partial<CreateClienteDto>