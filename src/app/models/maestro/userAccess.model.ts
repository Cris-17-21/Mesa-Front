import { CreateUserDto } from "../security/user.model";
import { CreateEmpresaDto } from "./empresa.model";
import { CreateSucursalDto } from "./sucursal.model";

export interface CreateCompleteRestaurantDto {
    empresa: CreateEmpresaDto;
    sucursal: CreateSucursalDto;
    user: CreateUserDto;
}