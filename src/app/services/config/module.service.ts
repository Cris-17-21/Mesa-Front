import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateModuleDto, Module, UpdateModuleDto } from '../../models/security/module.model';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {

  private API_URL = `${environment.apiUrl}/permission-modules`

  constructor(
    private http: HttpClient
  ) { }

  // GET DE TODOS LOS MODULOS
  getAllModules(): Observable<Module[]> {
    return this.http.get<Module[]>(this.API_URL);
  };

  // GET DE TODOS LOS MODULOS SIN HIJOS
  getAllModulesWithoutChildren(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.API_URL}/without-children`) 
  }

  // GET DE UN MODULO
  getOptionalModule(id: string): Observable<Module> {
    return this.http.get<Module>(`${this.API_URL}/${id}`)
  }

  // POST DE MODULO
  createModule(module: CreateModuleDto): Observable<Module> {
    return this.http.post<Module>(this.API_URL, module);
  }

  // PUT DE MODULO
  updateModule(module: UpdateModuleDto, id: string): Observable<Module> {
    return this.http.put<Module>(`${this.API_URL}/${id}`, module)
  }

  // DELETE DE MODULO
  deleteModule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
