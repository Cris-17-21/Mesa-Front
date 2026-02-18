import { Component, computed, inject, OnInit, signal } from '@angular/core';
// PrimeNG Imports (Opcionales, pero recomendados para UI bonita)
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../../models/inventario/producto.model';
import { ProductoService } from '../../../../services/inventario/producto.service';
import { CartService } from '../../../../services/venta/aux/cart.service';

@Component({
  selector: 'app-orden',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, BadgeModule],
  templateUrl: './orden.component.html',
  styleUrl: './orden.component.css'
})
export class OrdenComponent implements OnInit {

  // Inyecciones
  private productoService = inject(ProductoService);
  public cartService = inject(CartService); // Público para usar en HTML

  // Signals de Estado
  productos = signal<Producto[]>([]);
  categorias = signal<string[]>(['TODOS']);
  categoriaSeleccionada = signal<string>('TODOS');
  terminoBusqueda = signal<string>('');

  // Computed: Filtra productos por Categoría Y Texto de búsqueda
  productosFiltrados = computed(() => {
    const term = this.terminoBusqueda().toLowerCase();
    const cat = this.categoriaSeleccionada();

    return this.productos().filter(p => {
      const matchesCategory = cat === 'TODOS' || p.categoria === cat;
      const matchesSearch = p.nombre.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  });

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    // Cargar Productos
    this.productoService.obtenerProductos().subscribe(data => {
      this.productos.set(data);
    });

    // Cargar Categorías
    this.productoService.obtenerCategorias().subscribe(cats => {
      this.categorias.set(['TODOS', ...cats]);
    });
  }

  // Acciones UI
  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada.set(cat);
  }

  agregarAlCarrito(producto: Producto) {
    // Animación visual simple podría ir aquí
    this.cartService.addToCart(producto);
  }

  // Helpers para el buscador
  onSearch(event: any) {
    this.terminoBusqueda.set(event.target.value);
  }
}
