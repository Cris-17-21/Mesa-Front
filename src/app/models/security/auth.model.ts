import { Sucursal } from "../maestro/sucursal.model";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expirationAccessToken: string; 
  expirationRefreshToken: string; 
  requireSucursalSelection: boolean;
  sucursalesDisponibles: Sucursal[];
}

export interface RefreshRequest {
  refreshToken: string;
}