import { Empresa } from "./empresa.model";

// MODELO DE SUCURSAL
export interface Sucursal {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string;
    empresa: Empresa
}

// CREATE DTO
export type CreateSucursalDto = Omit<Sucursal, 'id'>

// UPDATE DTO
export type UpdateSucursalDto = Partial<CreateSucursalDto>