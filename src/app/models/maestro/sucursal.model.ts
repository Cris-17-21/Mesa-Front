// MODELO DE SUCURSAL
// El backend devuelve 'empresa' como string (razonSocial), nunca como objeto
export interface Sucursal {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string;
    empresa: string;
}

// CREATE DTO
export type CreateSucursalDto = Omit<Sucursal, 'id' | 'empresa'> & { empresaId: string };

// UPDATE DTO
export type UpdateSucursalDto = Partial<CreateSucursalDto>;