import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dni } from '../../models/auxiliar/dni.model';
import { Ruc } from '../../models/auxiliar/ruc.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {

  private API_URL = `${environment.apiUrl}/consultas`

  constructor(
    private http: HttpClient
  ) { }

  // CONSULTA DE DNI
  consultaDni(dni: string): Observable<Dni>{
    return this.http.get<Dni>(`${this.API_URL}/dni/${dni}`);
  }

  // CONSULTA DE RUC
  consultaRuc(ruc: string): Observable<Ruc> {
    return this.http.get<Ruc>(`${this.API_URL}/ruc/${ruc}`);
  }
}
