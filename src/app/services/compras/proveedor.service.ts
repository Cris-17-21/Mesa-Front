import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../core/environment/environment';
import { Observable } from 'rxjs';
import { Proveedor } from '../../models/compras/proveedor.model';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {
    private API_URL = `${environment.apiUrl}/proveedores`;

    constructor(private http: HttpClient) { }

    getAllProveedores(): Observable<Proveedor[]> {
        return this.http.get<Proveedor[]>(this.API_URL);
    }

    getProveedorById(id: number): Observable<Proveedor> {
        return this.http.get<Proveedor>(`${this.API_URL}/${id}`);
    }

    createProveedor(proveedor: Proveedor): Observable<Proveedor> {
        return this.http.post<Proveedor>(this.API_URL, proveedor);
    }

    updateProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
        return this.http.put<Proveedor>(`${this.API_URL}/${id}`, proveedor);
    }

    deleteProveedor(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}
