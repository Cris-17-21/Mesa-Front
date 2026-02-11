// MODELO DE MESA
export interface Mesa {
    id: string;
    codigoMesa: string;
    capacidad: number;
    estado: string;
    pisoNombre: string;
    idPrincipal: string;
}

// CREATE DTO
export type CreateMesaDto = Omit<Mesa, 'id' | 'idPrincipal' | 'estado'> & {
    pisoId: string;
}

// UPDATE DTO
export type UpdateMesaDto = Partial<CreateMesaDto>

// MODELO DE UNION DE MESA
export interface UnionMesa {
    idPrincipal: string;
    idsSecundarios: string[];
}


