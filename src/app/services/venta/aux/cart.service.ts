import { computed, Injectable, signal } from '@angular/core';
import { CartItem, PedidoDetalleRequestDto } from '../../../models/venta/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private _items = signal<CartItem[]>([]);

  // =================================================================
  // 2. COMPUTED (Cálculos automáticos)
  // =================================================================

  public readonly items = this._items.asReadonly();

  /** Total monetario del carrito actual */
  public readonly total = computed(() =>
    this._items().reduce((acc, item) => acc + (item.precio * item.cantidad), 0)
  );

  /** Cantidad total de platos/bebidas (para badge en el icono) */
  public readonly cantidadItems = computed(() =>
    this._items().reduce((acc, item) => acc + item.cantidad, 0)
  );

  /** Verifica si hay algo en el carrito */
  public readonly hasItems = computed(() => this._items().length > 0);

  // =================================================================
  // 3. ACTIONS (Lógica de negocio local)
  // =================================================================

  /**
   * Agrega un producto al carrito. 
   * Si ya existe, suma la cantidad.
   */
  addToCart(producto: any, cantidad: number = 1, observacion: string = '') {
    const currentItems = this._items();

    // Buscamos si ya existe el producto EXACTAMENTE igual (mismo ID)
    // Nota: Si manejas variantes complejas, la comparación sería más estricta.
    const existingItemIndex = currentItems.findIndex(i => i.productoId === producto.id);

    if (existingItemIndex !== -1) {
      // SI EXISTE: Actualizamos inmutablemente
      this._items.update(items => {
        const newItems = [...items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          cantidad: newItems[existingItemIndex].cantidad + cantidad
        };
        return newItems;
      });
    } else {
      // NO EXISTE: Agregamos nuevo
      const newItem: CartItem = {
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidad,
        observaciones: observacion,
        categoria: producto.categoria?.nombre || 'General'
      };
      this._items.update(items => [...items, newItem]);
    }
  }

  /**
   * Elimina un item completamente del carrito
   */
  removeItem(productoId: string) {
    this._items.update(items => items.filter(i => i.productoId !== productoId));
  }

  /**
   * Aumenta o disminuye la cantidad.
   * Si llega a 0, se elimina.
   */
  updateQuantity(productoId: string, change: number) {
    this._items.update(items => {
      return items.map(item => {
        if (item.productoId === productoId) {
          const newQuantity = item.cantidad + change;
          return { ...item, cantidad: Math.max(0, newQuantity) };
        }
        return item;
      }).filter(item => item.cantidad > 0); // Limpiamos los que quedaron en 0
    });
  }

  /**
   * Actualiza la nota/observación de un item
   */
  updateObservation(productoId: string, observacion: string) {
    this._items.update(items =>
      items.map(i => i.productoId === productoId ? { ...i, observaciones: observacion } : i)
    );
  }

  /**
   * Limpia el carrito (ej. después de enviar el pedido con éxito)
   */
  clear() {
    this._items.set([]);
  }

  /**
   * PREPARACIÓN PARA BACKEND
   * Convierte el carrito local al formato que tu API espera (PedidoDetalleRequestDto[])
   */
  getPayloadDetalles(): PedidoDetalleRequestDto[] {
    return this._items().map(item => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      observaciones: item.observaciones || ''
    }));
  }
}
