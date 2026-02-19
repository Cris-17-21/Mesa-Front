import { Injectable } from '@angular/core';
import { Producto } from '../../models/inventario/producto.model';
import { delay, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private API_URL = `${environment.apiUrl}/productos`

  constructor(
    private http: HttpClient
  ) { }

  getProductoByEmpresaId(empresaId: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.API_URL}/empresa/${empresaId}`);
  }

}
