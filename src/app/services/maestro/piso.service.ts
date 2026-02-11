import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Piso } from '../../models/maestro/piso.model';

@Injectable({
  providedIn: 'root'
})
export class PisoService {

  private API_URL = `${environment.apiUrl}/pisos`

  constructor(
    private http: HttpClient
  ) { }

  // GET DE PISOS POR SUCURSAL
  getPisosBySucursal(sucursalId: string): Observable<Piso[]> {
    return this.http.get<Piso[]>(`${this.API_URL}/sucursal/${sucursalId}`);
  }

  // GET DE UN PISO
  getOptionalPiso(pisoId: string): Observable<Piso> {
    return this.http.get<Piso>(`${this.API_URL}/${pisoId}`);
  }

  // POST DE PISO
  createPiso(piso: Piso): Observable<Piso> {
    return this.http.post<Piso>(this.API_URL, piso);
  }

  // PUT DE PISO
  updatePiso(piso: Piso): Observable<Piso> {
    return this.http.put<Piso>(`${this.API_URL}/${piso.id}`, piso);
  }

  // DELETE DE PISO
  deletePiso(pisoId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${pisoId}`);
  }
}
