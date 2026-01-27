import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateRoleDto, Role, UpdateRoleDto } from '../../models/security/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private API_URL = `${environment.apiUrl}/roles`

  constructor(
    private http: HttpClient
  ) { }

  // GET DE TODOS LOS ROLES
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.API_URL);
  };

  // GET DE UN ROLE
  getOptionalRole(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.API_URL}/${id}`)
  }

  // POST DE ROLE
  createRole(role: CreateRoleDto): Observable<Role> {
    return this.http.post<Role>(this.API_URL, role);
  }

  // PUT DE ROLE
  updateRole(role: UpdateRoleDto, id: string): Observable<Role> {
    return this.http.put<Role>(`${this.API_URL}/${id}`, role)
  }

  // DELETE DE ROLE
  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
