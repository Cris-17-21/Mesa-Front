import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMetodoPagoDto, MetodoPago, UpdateMetodoPagoDto } from '../../models/maestro/metodo-pago.model';

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {

  private API_URL = `${environment.apiUrl}/medios-pago`;

  constructor(
    private http: HttpClient
  ) { }

  getMetodoPagoByEmpresa(empresaId: string): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${this.API_URL}/empresa/${empresaId}`);
  }

  getMetodoPagoById(id: string): Observable<MetodoPago> {
    return this.http.get<MetodoPago>(`${this.API_URL}/${id}`);
  }

  createMetodoPago(metodoPago: CreateMetodoPagoDto): Observable<MetodoPago> {
    return this.http.post<MetodoPago>(this.API_URL, metodoPago);
  }

  updateMetodoPago(metodoPago: UpdateMetodoPagoDto, id: string): Observable<MetodoPago> {
    return this.http.put<MetodoPago>(`${this.API_URL}/${id}`, metodoPago);
  }

  deleteMetodoPago(id: string, empresaId: string): Observable<void> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.delete<void>(`${this.API_URL}/${id}`, { params });
  }
}
