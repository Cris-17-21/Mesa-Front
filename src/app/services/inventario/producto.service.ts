import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/environment/environment';
import { Observable } from 'rxjs';
import { Producto, PlatoSalesHistory } from '../../models/inventario/producto.model';
import { AuthService } from '../../core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private API_URL = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getAllProductos(): Observable<Producto[]> {
    const sucursalId = this.authService.getSucursalId();
    return this.http.get<Producto[]>(`${this.API_URL}/sucursal/${sucursalId}`);
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.API_URL}/${id}`);
  }

  createProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.API_URL, producto);
  }

  updateProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.API_URL}/${id}`, producto);
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getProductoBySucursalId(sucursalId: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.API_URL}/sucursal/${sucursalId}`);
  }

  // Legacy method for other team's modules 
  getProductoByEmpresaId(empresaId: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.API_URL}/empresa/${empresaId}`);
  }

  getPlatos(sucursalId: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.API_URL}/sucursal/${sucursalId}/platos`);
  }

  getPlatosVentas(sucursalId: string): Observable<PlatoSalesHistory[]> {
    return this.http.get<PlatoSalesHistory[]>(`${this.API_URL}/sucursal/${sucursalId}/platos/ventas`);
  }
}
