import { Component, computed, EventEmitter, inject, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidoService } from '../../../../services/venta/pedido.service';
import { ProductoService } from '../../../../services/inventario/producto.service';
import { CategoriaService } from '../../../../services/inventario/categoria.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { CartItem, PedidoRequestDto, PedidoDetalleRequestDto } from '../../../../models/venta/pedido.model';
import { Producto } from '../../../../models/inventario/producto.model';
import { CheckoutModalComponent } from '../../pos/checkout-modal/checkout-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pre-cuenta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    InputNumberModule,
    AutoCompleteModule,
    CheckoutModalComponent
  ],
  templateUrl: './pre-cuenta-modal.component.html',
  styleUrl: './pre-cuenta-modal.component.css'
})
export class PreCuentaModalComponent implements OnChanges {

  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private authService = inject(AuthService);

  @Input() visible = false;
  @Input() sucursalId!: string;
  @Input() usuarioId!: string;
  @Input() modo: 'NUEVO' | 'EDITAR' = 'NUEVO';
  @Input() pedidoId: string | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  deliveryForm: FormGroup;
  cart = signal<CartItem[]>([]);
  loading = signal(false);
  showCheckout = signal(false);

  // --- POS Logic ---
  categorias = signal<any[]>([]);
  allProducts = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  categoriaSeleccionada = signal<any | null>(null);
  terminoBusqueda = signal<string>('');
  vistaMovil = signal<'MENU' | 'CUENTA'>('MENU');

  // IDs de los detalles ya existentes en el pedido (para bloquarlos)
  private itemsExistentesIds = new Set<string>();

  constructor() {
    this.deliveryForm = this.fb.group({
      nombreCliente: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      direccion: ['', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.deliveryForm.reset();
      this.cart.set([]);
      this.itemsExistentesIds.clear();
      this.categoriaSeleccionada.set(null);
      this.terminoBusqueda.set('');
      this.showCheckout.set(false);
      this.vistaMovil.set('MENU');

      this.loadInitialData();

      if (this.modo === 'EDITAR' && this.pedidoId) {
        this.cargarPedidoExistente();
      }
    }
  }

  loadInitialData() {
    const empresaId = this.authService.getClaim('empresaId');
    if (empresaId) {
      // Categorías
      this.categoriaService.getCategoriasByEmpresa(empresaId).subscribe(data => {
        this.categorias.set(data);
      });

      // Productos
      this.productoService.getProductoByEmpresaId(empresaId).subscribe(data => {
        this.allProducts.set(data);
        this.aplicarFiltros();
      });
    }
  }

  cargarPedidoExistente() {
    if (!this.pedidoId) return;
    this.pedidoService.seleccionarPedido(this.pedidoId).subscribe(p => {
      this.deliveryForm.patchValue({
        nombreCliente: p.nombreCliente,
        telefono: p.telefono,
        direccion: p.direccion
      });

      if (p.detalles && p.detalles.length > 0) {
        const itemsDelPedido: CartItem[] = p.detalles.map(d => {
          this.itemsExistentesIds.add(d.id);
          return {
            productoId: d.id,
            nombre: d.productoNombre,
            precio: d.precioUnitario,
            cantidad: d.cantidad,
            observaciones: d.observaciones || ''
          };
        });
        this.cart.set(itemsDelPedido);
      }
    });
  }

  onSearch(event: Event) {
    this.terminoBusqueda.set((event.target as HTMLInputElement).value.toLowerCase());
    this.aplicarFiltros();
  }

  seleccionarCategoria(cat: any) {
    this.categoriaSeleccionada.set(this.categoriaSeleccionada() === cat ? null : cat);
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    let lista = this.allProducts();
    const cat = this.categoriaSeleccionada();
    const term = this.terminoBusqueda();

    if (cat) {
      lista = lista.filter(p => p.idCategoria.toString() === cat.id.toString());
    }

    if (term) {
      lista = lista.filter(p =>
        p.nombreProducto.toLowerCase().includes(term) ||
        p.nombreCategoria?.toLowerCase().includes(term)
      );
    }

    this.productosFiltrados.set(lista);
  }

  agregarAlCarrito(producto: Producto) {
    const id = producto.idProducto.toString();
    this.cart.update(prev => {
      const ex = prev.find(i => i.productoId === id);
      return ex
        ? prev.map(i => i.productoId === id ? { ...i, cantidad: i.cantidad + 1 } : i)
        : [...prev, { productoId: id, nombre: producto.nombreProducto, precio: producto.precioVenta, cantidad: 1, observaciones: '' }];
    });
  }

  esItemExistente(productoId: string): boolean {
    return this.itemsExistentesIds.has(productoId);
  }

  updateQty(index: number, delta: number) {
    this.cart.update(items => {
      const copy = [...items];
      const item = copy[index];
      if (this.esItemExistente(item.productoId)) return items;

      const newQty = item.cantidad + delta;
      if (newQty > 0) copy[index].cantidad = newQty;
      return copy;
    });
  }

  removeItem(index: number) {
    const item = this.cart()[index];
    if (this.esItemExistente(item.productoId)) return;
    this.cart.update(items => items.filter((_, i) => i !== index));
  }

  total = () => this.cart().reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  save() {
    if (this.deliveryForm.invalid || this.cart().length === 0) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    const itemsAEnviar = this.modo === 'EDITAR'
      ? this.cart().filter(i => !this.itemsExistentesIds.has(i.productoId))
      : this.cart();

    if (this.modo === 'EDITAR' && itemsAEnviar.length === 0) {
      Swal.fire('Sin cambios', 'No hay productos nuevos para agregar.', 'info');
      return;
    }

    this.loading.set(true);

    const detalles: PedidoDetalleRequestDto[] = itemsAEnviar.map(i => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
      observaciones: i.observaciones || ''
    }));

    const obs = this.modo === 'NUEVO'
      ? this.pedidoService.crearPedido({
        tipoEntrega: 'DELIVERY',
        sucursalId: this.sucursalId,
        usuarioId: this.usuarioId,
        mesaId: '',
        detalles,
        nombreCliente: this.deliveryForm.value.nombreCliente,
        telefono: this.deliveryForm.value.telefono,
        direccion: this.deliveryForm.value.direccion
      })
      : this.pedidoService.agregarDetalles(this.pedidoId!, detalles);

    obs.subscribe({
      next: () => {
        Swal.fire('ÉXITO', 'Pedido procesado correctamente.', 'success');
        this.onSave.emit();
        this.close();
      },
      error: (err) => {
        Swal.fire('ERROR', err.error?.message || 'No se pudo procesar el pedido', 'error');
      },
      complete: () => this.loading.set(false)
    });
  }

  abrirCobrar() { if (this.pedidoId) this.showCheckout.set(true); }
  onCobroFinalizado(e: boolean) { if (e) { this.onSave.emit(); this.close(); } }

  close() {
    this.visibleChange.emit(false);
  }
}
