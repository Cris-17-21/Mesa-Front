
// MODELO DE CLIENTE
export interface Cliente {
    id: string,
    tipoDocumento: string,
    numeroDocumento: string,
    nombraRazonSocial: string,
    direccion: string,
    correo: string,
    telefono: string
}

// CREATE DTO
export type CreateClienteDto = Omit<Cliente, 'id' | 'tipoDocumento'> & {
    empresaId: string;
    tipoDocumentoId: string;
}

// UPDATE DTO
export type UpdateClienteDto = Partial<CreateClienteDto>