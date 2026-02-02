import { CreateUserDto } from "../security/user.model";
import { CreateEmpresaDto } from "./empresa.model";
import { CreateSucursalDto } from "./sucursal.model";

export interface CreateCompleteRestaurantDto {
    // Paso 1: Empresa
    empresa: CreateEmpresaDto;
    // Paso 2: Sucursal
    sucursal: Omit<CreateSucursalDto, 'empresa'>; 
    // Paso 3: Usuario Admin
    usuario: CreateUserDto;
}