import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMesaDto, Mesa, UpdateMesaDto } from '../../models/maestro/mesa.model';

@Injectable({
  providedIn: 'root'
})
export class MesaService {

  private API_URL = `${environment.apiUrl}/mesas`

  constructor(
    private http: HttpClient
  ) { }

  // Listar mesas por el ID del piso seleccionado
  getMesasByPiso(pisoId: string): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.API_URL}/piso/${pisoId}`);
  }

  getMesaById(id: string): Observable<Mesa> {
    return this.http.get<Mesa>(`${this.API_URL}/${id}`);
  }

  createMesa(mesa: CreateMesaDto): Observable<Mesa> {
    return this.http.post<Mesa>(this.API_URL, mesa);
  }

  updateMesa(mesa: UpdateMesaDto, id: string): Observable<Mesa> {
    return this.http.put<Mesa>(`${this.API_URL}/${id}`, mesa);
  }

  // Cambiar estado (LIBRE, OCUPADA, SUCIA, etc.)
  // Usamos HttpParams para enviar el string como @RequestParam
  cambiarEstado(id: string, nuevoEstado: string): Observable<Mesa> {
    const params = new HttpParams().set('nuevoEstado', nuevoEstado.toUpperCase());
    return this.http.patch<Mesa>(`${this.API_URL}/${id}/estado`, {}, { params });
  }

  // Unir Mesas: requiere el ID principal y la lista de IDs secundarios
  unirMesas(idPrincipal: string, idsSecundarios: string[]): Observable<void> {
    const body = { idPrincipal, idsSecundarios };
    return this.http.post<void>(`${this.API_URL}/unir`, body);
  }

  separarMesas(idPrincipal: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/separar/${idPrincipal}`, {});
  }

  deleteMesa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
