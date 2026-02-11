import { Mesa } from "./mesa.model";

// MODELO DE PISO
export interface Piso {
    id: string;
    nombre: string;
    descripcion: string;
    sucursal: string;
    mesas: Mesa[];
}

// CREATE DTO
export type CreatePisoDto = Omit<Piso, 'id' | 'sucursal' | 'mesas'> & {
    sucursalId: string;
}

// UPDATE DTO
export type UpdatePisoDto = Partial<CreatePisoDto>


