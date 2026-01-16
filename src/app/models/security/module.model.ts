import { Permission } from "./permission.model";

// MODELO DE MODULO
export interface Module {
    id: string;
    name: string;
    displayOrder: number;
    urlPath: string;
    iconName: string;
    parent?: Module | null; //Recursividad, en caso el modulo tenga un modulo padre
    permissions?: Permission[]
};

// CREATE DTO
export type CreateModuleDto = Omit<Module, 'id' | 'parent' | 'permissions'> & {
    parentId?: string | null; //En caso el modulo sea dentro de otro modulo
};

// UPDATE DTO
export type UpdateModuleDto = Partial<CreateModuleDto>;