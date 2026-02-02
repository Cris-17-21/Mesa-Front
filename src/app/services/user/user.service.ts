import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../core/environment/environment';
import { CreateUserDto, UpdateUserDto, User } from '../../models/security/user.model';
import { AuthProfile } from '../../models/security/navigation.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private API_URL = `${environment.apiUrl}/users`

  constructor(
    private http: HttpClient
  ) { }

  // GET DE TODOS LOS USUARIOS
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL);
  };

  //GET DE USUARIO
  getOptionalUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  };

  //GET DE USUARIO ACTUAL
  getUserMe(): Observable<AuthProfile> {
    return this.http.get<AuthProfile>(`${this.API_URL}/me`);
  };

  //POST DE USUARIO
  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.API_URL, user);
  };

  //PUT DE USUARIO
  updateUser(user: UpdateUserDto, id: string): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, user);
  };

  //DELETE DE USUARIO
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
