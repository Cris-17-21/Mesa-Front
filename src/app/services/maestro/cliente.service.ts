import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../../models/maestro/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private API_URL = `${environment.apiUrl}/clientes`

  constructor(
    private http: HttpClient
  ) { }

  getAllClientesByEmpresa(empresaId: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.API_URL}/empresa/${empresaId}`);
  }

  getOptionalCliente(clienteId: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.API_URL}/${clienteId}`);
  }

  getClienteByDocument(doc: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.API_URL}/documento/${doc}`);
  }

  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.API_URL, cliente);
  }

  updateCliente(cliente: Cliente, id: string): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.API_URL}/${id}`, cliente);
  }

  deleteCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
