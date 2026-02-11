import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../environment/environment';
import { AuthResponse, LoginRequest } from '../../models/security/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // --- SIGNALS DE ESTADO ---
  // Guardamos los permisos para que cualquier componente reaccione al cambio
  public permissions = signal<string[]>([]);

  // Signal derivado para saber si es SuperAdmin de forma rápida
  public isSuperAdmin = computed(() => this.permissions().includes('ROLE_SUPER_ADMIN'));

  public currentBranchName = signal<string>(localStorage.getItem('nombreSedeActual') || 'Sin Sede');

  constructor() {
    this.loadInitialState();
  }

  // --- MÉTODOS DE AUTENTICACIÓN ---

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => {
        // SOLO guardamos si no requiere elegir sucursal (Login directo)
        if (!res.requireSucursalSelection) {
          this.saveTokens(res);
          this.loadInitialState();
        }
      })
    );
  }

  // Paso final para Administradores con múltiples sedes
  selectBranch(userId: string, sucursalId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/select-branch`, { userId, sucursalId }).pipe(
      tap(res => {
        this.saveTokens(res);
        this.loadInitialState(); // Cargamos permisos del nuevo token definitivo
      })
    );
  }

  refreshToken(data: { refreshToken: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, data).pipe(
      tap(res => {
        this.saveTokens(res);
        this.loadInitialState();
      })
    );
  }

  // --- GESTIÓN DE TOKENS Y ESTADO ---

  public saveTokens(res: AuthResponse) {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  private loadInitialState() {
    const token = this.getToken();
    if (token) {
      try {
        const payload = this.decodeToken(token);
        // REGLA DE ORO: Siempre en MAYÚSCULAS para evitar errores de match
        const auths = (payload.authorities as string[]) || [];
        this.permissions.set(auths.map(a => a.toUpperCase()));
      } catch (e) {
        this.logout();
      }
    }
  }

  public hasPermission(permission: string): boolean {
    return this.permissions().includes(permission.toUpperCase());
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Opcional: Podrías verificar aquí si el token no ha expirado
    return true;
  }

  logout() {
    localStorage.removeItem('nombreSedeActual');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentBranchName.set('Sin Sede');
    this.permissions.set([]);
    this.router.navigate(['/login']);
  }

  public setBranchName(name: string) {
    localStorage.setItem('nombreSedeActual', name);
    this.currentBranchName.set(name);
  }

  // --- UTILIDADES ---

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return {};
    }
  }

  /**
   * Obtiene cualquier campo del payload del token (empresaId, sucursalId, sub, etc.)
   */
  getClaim(claim: string): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload[claim] || null;
  }

  // En auth.service.ts
  getUserBranches(userId: string): Observable<any[]> {
    // Prueba si el endpoint acepta el empresaId que viene en el token
    const payload = this.decodeToken(this.getToken() || '');
    const idToQuery = payload.empresaId || userId;
    return this.http.get<any[]>(`${this.API_URL}/user-branches/${idToQuery}`);
  }
}