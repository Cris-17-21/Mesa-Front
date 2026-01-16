import { Permission } from "./permission.model";

// MODELO DE ROLE
export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
};

// CREATE DTO
export type CreateRoleDto = Omit<Role, 'id' | 'permissions'> & {
    permissionIds: string[];
};

// UPDATE DTO
export type UpdateRoleDto = Partial<CreateRoleDto>;