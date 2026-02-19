import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/environment/environment';
import { Observable } from 'rxjs';
import { TipoProducto } from '../../models/inventario/tipo-producto.model';

@Injectable({
    providedIn: 'root'
})
export class TipoProductoService {
    private API_URL = `${environment.apiUrl}/tipos-producto`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<TipoProducto[]> {
        return this.http.get<TipoProducto[]>(this.API_URL);
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
