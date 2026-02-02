import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateSucursalDto, Sucursal, UpdateSucursalDto } from '../../models/maestro/sucursal.model';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {

  private API_URL = `${environment.apiUrl}/sucursales`

  constructor(
    private http: HttpClient
  ) { }

  // GET DE TODAS LAS SUCURSALES
  getAllSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.API_URL);
  };

  // GET DE UNA SUCURSAL
  getOptionalSucursal(id: string): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.API_URL}/${id}`)
  }

  // POST DE SUCURSAL
  createSucursal(sucursal: CreateSucursalDto): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.API_URL, sucursal);
  }

  // PUT DE SUCURSAL
  updateSucursal(sucursal: UpdateSucursalDto, id: string): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.API_URL}/${id}`, sucursal)
  }

  // DELETE DE SUCURSAL
  deleteSucursal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
