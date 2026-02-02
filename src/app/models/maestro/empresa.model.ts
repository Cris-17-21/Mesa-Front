import { Sucursal } from "./sucursal.model";

// MODELO DE EMPRESA
export interface Empresa {
    id: string;
    ruc: string;
    razonSocial: string;
    direccionFiscal: string;
    telefono: string;
    email: string;
    logoUrl: string;
    sucursales?: Sucursal[]
}

// CREATE DTO
export type CreateEmpresaDto = Omit<Empresa, 'id' | 'sucursal'>

// UPDATE DTO
export type UpdateEmpresaDto = Partial<CreateEmpresaDto>