import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoriaProducto } from '../../models/inventario/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  private API_URL = `${environment.apiUrl}/categorias`

  constructor(private http: HttpClient) { }

  getCategoriasByEmpresa(empresaId: string): Observable<CategoriaProducto[]> {
    return this.http.get<CategoriaProducto[]>(this.API_URL + `/empresa/${empresaId}`)
  }
}
