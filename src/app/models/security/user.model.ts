import { Empresa } from "../maestro/empresa.model";
import { Sucursal } from "../maestro/sucursal.model";
import { Role } from "./role.model";

// MODELO DE USUARIO
export interface User {
    id: string;
    username: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    tipoDocumento: string;
    numeroDocumento: string;
    telefono: string;
    direccion: string;
    email: string;
    role: Role | string;
    empresa: Empresa;
    sucursal: Sucursal
};

// CREATE DTO
export type CreateUserDto = Omit<User, 'id' | 'role' | 'empresa' | 'sucursal'> & {
    password: string;
    role: string;
    empresaId: string | null;
    sucursalId: string | null;
};

// UPDATE DTO
export type UpdateUserDto = Partial<CreateUserDto>; 