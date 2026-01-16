import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { throwError, Observable, of } from 'rxjs';
import { environment } from '../environment/environment';
import { User } from '../../models/security/user.model';
import { AuthProfile, NavigationItem } from '../../models/security/navigation.model';
import { AuthResponse, LoginRequest, RefreshRequest } from '../../models/security/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  
  private API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  refreshToken(data: RefreshRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, data).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  private saveTokens(res: AuthResponse) {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  getToken() { 
    return localStorage.getItem('accessToken'); 
  }
  
  getRefreshToken() { 
    return localStorage.getItem('refreshToken'); 
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}