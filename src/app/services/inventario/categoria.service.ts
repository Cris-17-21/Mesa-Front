import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/environment/environment';
import { Observable } from 'rxjs';
import { Categoria } from '../../models/inventario/categoria.model';
import { AuthService } from '../../core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private API_URL = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getAll(): Observable<Categoria[]> {
    const sucursalId = this.authService.getSucursalId();
    return this.http.get<Categoria[]>(`${this.API_URL}/sucursal/${sucursalId}`);
  }

  create(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(this.API_URL, categoria);
  }

  update(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.API_URL}/${id}`, categoria);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getCategoriasBySucursal(sucursalId: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.API_URL}/sucursal/${sucursalId}`);
  }

  // Legacy method for other team's modules 
  getCategoriasByEmpresa(empresaId: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.API_URL}/empresa/${empresaId}`);
  }
}
