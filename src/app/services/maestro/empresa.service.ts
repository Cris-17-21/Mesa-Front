import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateEmpresaDto, Empresa, UpdateEmpresaDto } from '../../models/maestro/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private API_URL = `${environment.apiUrl}/empresas`

  constructor(
    private http: HttpClient
  ) { }

  // GET DE TODAS LAS EMPRESAS
  getAllEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.API_URL);
  };

  // GET DE UNA EMPRESA
  getOptionalEmpresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.API_URL}/${id}`)
  }

  // POST DE EMPRESA
  createEmpresa(empresa: CreateEmpresaDto): Observable<Empresa> {
    return this.http.post<Empresa>(this.API_URL, empresa);
  }

  // PUT DE EMPRESA
  updateEmpresa(empresa: UpdateEmpresaDto, id: string): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.API_URL}/${id}`, empresa)
  }

  // DELETE DE EMPRESA
  deleteEmpresa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
