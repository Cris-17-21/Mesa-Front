import { User } from "./user.model";

// MODELO DE NAVIGATION ITEM
export interface NavigationItem {
    name: string;
    order: number | null;
    urlPath: string;
    iconName: string;
    permissions?: NavigationPermission[];
    children?: NavigationItem[];
}

// PERMISSION EN NAVEGACIÓN (Simplificado)
export interface NavigationPermission {
    id: string;
    name: string;
}

export interface AuthProfile {
    user: User;
    navigation: NavigationItem[];
}