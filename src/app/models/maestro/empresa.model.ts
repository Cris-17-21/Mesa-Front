import { Sucursal } from "./sucursal.model";

// MODELO DE EMPRESA
export interface Empresa {
    id: string;
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    direccionFiscal: string;
    ubigeo?: string;
    provincia?: string;
    departamento?: string;
    distrito?: string;
    telefono: string;
    email: string;
    logoUrl: string;
    fechaAfiliacion?: string;
    usuarioSol?: string;
    claveSol?: string;
    claveCertificado?: string;
    entorno?: boolean;
    certificadoDigital?: string;
    sucursales?: Sucursal[]
}

// CREATE DTO
export type CreateEmpresaDto = Omit<Empresa, 'id' | 'sucursales'>

// UPDATE DTO
export type UpdateEmpresaDto = Partial<CreateEmpresaDto>