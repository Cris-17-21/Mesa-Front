import { Module } from "./module.model";

// MODELO DE PERMISSION
export interface Permission {
    id: string;
    name: string;
    description: string;
    module: Module;
};

// CREATE DTO
export type CreatePermissionDto = Omit<Permission, 'id' | 'module'> & {
    moduleId: string;
};

//UPDATE DTO
export type UpdatePermissionDto = Partial<CreatePermissionDto>;