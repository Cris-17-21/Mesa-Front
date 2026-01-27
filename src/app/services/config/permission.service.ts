import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreatePermissionDto, Permission, UpdatePermissionDto } from '../../models/security/permission.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private API_URL = `${environment.apiUrl}/permissions`

  constructor(
    private http: HttpClient
  ) { }

  // GET DE TODOS LOS PERMISSIONS
  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.API_URL);
  };

  // GET DE UN PERMISSION
  getOptionalPermission(id: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.API_URL}/${id}`)
  }

  // POST DE PERMISSION
  createPermission(permission: CreatePermissionDto): Observable<Permission> {
    return this.http.post<Permission>(this.API_URL, permission);
  }

  // PUT DE PERMISSION
  updatePermission(permission: UpdatePermissionDto, id: string): Observable<Permission> {
    return this.http.put<Permission>(`${this.API_URL}/${id}`, permission)
  }

  // DELETE DE PERMISSION
  deletePermission(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
