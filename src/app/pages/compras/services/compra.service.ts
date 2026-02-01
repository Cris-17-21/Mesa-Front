import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Compra } from '../models/compra.model';

@Injectable({
    providedIn: 'root'
})
export class CompraService {

    // Mock data para simular backend por ahora
    private compras: Compra[] = [
        {
            id: 1,
            proveedorId: 101,
            proveedorNombre: 'Distribuidora Alimentos SAC',
            fecha: new Date().toISOString(),
            nroComprobante: 'F001-12345',
            total: 1500.50,
            estado: 'PAGADO',
            detalles: []
        },
        {
            id: 2,
            proveedorId: 102,
            proveedorNombre: 'Bebidas del Norte',
            fecha: new Date().toISOString(),
            nroComprobante: 'B002-98765',
            total: 500.00,
            estado: 'PENDIENTE',
            detalles: []
        }
    ];

    constructor() { }

    getCompras(): Observable<Compra[]> {
        return of(this.compras);
    }

    getCompraById(id: number): Observable<Compra | undefined> {
        const compra = this.compras.find(c => c.id === id);
        return of(compra);
    }

    createCompra(compra: Compra): Observable<Compra> {
        compra.id = this.compras.length + 1;
        compra.fecha = new Date().toISOString();
        this.compras.push(compra);
        return of(compra);
    }

    deleteCompra(id: number): Observable<boolean> {
        this.compras = this.compras.filter(c => c.id !== id);
        return of(true);
    }
}
