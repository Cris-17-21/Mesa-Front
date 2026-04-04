import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/environment/environment';
import { Observable } from 'rxjs';
import { TipoProducto } from '../../models/inventario/tipo-producto.model';
import { AuthService } from '../../core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class TipoProductoService {
    private API_URL = `${environment.apiUrl}/tipos-producto`;

    constructor(private http: HttpClient, private authService: AuthService) { }

    getAll(): Observable<TipoProducto[]> {
        const sucursalId = this.authService.getSucursalId();
        return this.http.get<TipoProducto[]>(`${this.API_URL}/sucursal/${sucursalId}`);
    }

    getByCategoria(categoriaId: number): Observable<TipoProducto[]> {
        return this.http.get<TipoProducto[]>(`${this.API_URL}/categoria/${categoriaId}`);
    }

    create(tipo: TipoProducto): Observable<TipoProducto> {
        return this.http.post<TipoProducto>(this.API_URL, tipo);
    }

    update(id: number, tipo: TipoProducto): Observable<TipoProducto> {
        return this.http.put<TipoProducto>(`${this.API_URL}/${id}`, tipo);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
