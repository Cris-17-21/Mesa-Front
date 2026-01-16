export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expirationAccessToken: string; 
  expirationRefreshToken: string; 
}

export interface RefreshRequest {
  refreshToken: string;
}