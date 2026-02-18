import { Injectable } from '@angular/core';
import { Producto } from '../../models/inventario/producto.model';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  // DATOS FICTICIOS (MOCK)
  private mockProductos: Producto[] = [
    // ENTRADAS
    { id: '1', nombre: 'Ceviche Clásico', precio: 35.00, categoria: 'ENTRADAS', imagen: 'https://placehold.co/200x200/orange/white?text=Ceviche' },
    { id: '2', nombre: 'Papa a la Huancaína', precio: 18.00, categoria: 'ENTRADAS', imagen: 'https://placehold.co/200x200/yellow/black?text=Papa' },
    { id: '3', nombre: 'Tequeños de Queso', precio: 15.00, categoria: 'ENTRADAS', imagen: 'https://placehold.co/200x200/brown/white?text=Tequeños' },

    // FONDOS
    { id: '4', nombre: 'Lomo Saltado', precio: 42.00, categoria: 'FONDOS', imagen: 'https://placehold.co/200x200/red/white?text=Lomo' },
    { id: '5', nombre: 'Ají de Gallina', precio: 30.00, categoria: 'FONDOS', imagen: 'https://placehold.co/200x200/orange/black?text=Aji' },
    { id: '6', nombre: 'Arroz con Mariscos', precio: 38.00, categoria: 'FONDOS', imagen: 'https://placehold.co/200x200/orange/white?text=Arroz' },
    { id: '7', nombre: 'Tallarín Saltado', precio: 36.00, categoria: 'FONDOS', imagen: 'https://placehold.co/200x200/red/white?text=Tallarin' },

    // BEBIDAS
    { id: '8', nombre: 'Inca Kola 1L', precio: 12.00, categoria: 'BEBIDAS', imagen: 'https://placehold.co/200x200/yellow/blue?text=Inca+Kola' },
    { id: '9', nombre: 'Chicha Morada (Jarra)', precio: 15.00, categoria: 'BEBIDAS', imagen: 'https://placehold.co/200x200/purple/white?text=Chicha' },
    { id: '10', nombre: 'Cerveza Cusqueña', precio: 10.00, categoria: 'BEBIDAS', imagen: 'https://placehold.co/200x200/gold/black?text=Cusqueña' },
  ];

  constructor() { }

  /**
   * Simula GET /api/productos
   */
  obtenerProductos(): Observable<Producto[]> {
    // Usamos 'of' para crear un Observable y 'delay' para simular latencia de red (300ms)
    return of(this.mockProductos).pipe(delay(300));
  }

  /**
   * Obtiene categorías únicas basadas en los productos
   */
  obtenerCategorias(): Observable<string[]> {
    const categorias = [...new Set(this.mockProductos.map(p => p.categoria))];
    return of(categorias).pipe(delay(300));
  }
}
