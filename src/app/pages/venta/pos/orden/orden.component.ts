import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TooltipModule } from 'primeng/tooltip';
import { PedidoService } from '../../../../services/venta/pedido.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserService } from '../../../../services/user/user.service';
import { ProductoService } from '../../../../services/inventario/producto.service';
import { CategoriaService } from '../../../../services/inventario/categoria.service';
import { CajaService } from '../../../../services/venta/caja.service';
import { PedidoRequestDto, PedidoDetalleRequestDto, CartItem, PedidoResponseDto } from '../../../../models/venta/pedido.model';
import { Producto } from '../../../../models/inventario/producto.model';
import { CheckoutModalComponent } from '../checkout-modal/checkout-modal.component';
import { DividirCuentaModalComponent } from '../dividir-cuenta-modal/dividir-cuenta-modal.component';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { Categoria } from '../../../../models/inventario/categoria.model';

@Component({
  selector: 'app-orden',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule,
    BadgeModule, ScrollPanelModule, TooltipModule,
    CheckoutModalComponent, DividirCuentaModalComponent
  ],
  templateUrl: './orden.component.html',
  styleUrl: './orden.component.css'
})
export class OrdenComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private userService = inject(UserService);
  private cajaService = inject(CajaService);
  private router = inject(Router);

  @Input() mesaIdInput!: string;
  @Input() pedidoIdInput: string | null = null;
  @Input() modoInput: 'NUEVO' | 'EDITAR' = 'NUEVO';
  @Input() codigoMesaInput: string = '';

  @Output() onCerrar = new EventEmitter<void>();

  categorias = signal<any[]>([]);
  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  categoriaSeleccionada = signal<any | null>(null);
  terminoBusqueda = signal<string>('');
  vistaMovil = signal<'MENU' | 'CUENTA'>('MENU');
  carrito = signal<CartItem[]>([]);
  pedidoExistente = signal<PedidoResponseDto | null>(null);
  showCheckout = signal(false);
  showDividir = signal(false);

  currentEmpresaId: string | null = null;
  currentUsuarioId: string | null = null;
  currentSucursalId: string | null = null;
  // IDs de los detalles ya existentes en el pedido (para no re-enviarlos)
  private itemsExistentesIds = new Set<string>();

  totalCarrito = computed(() => this.carrito().reduce((acc, item) => acc + (item.precio * item.cantidad), 0));
  cantidadItemsCarrito = computed(() => this.carrito().reduce((acc, item) => acc + item.cantidad, 0));
  // En modo EDITAR el carrito ya incluye los items del pedido existente, no sumar totalFinal de nuevo
  totalGeneral = computed(() => this.totalCarrito());

  ngOnInit() {
    this.cargarDatosSesion().then(() => this.cargarDatosMaestros());
    if (this.modoInput === 'EDITAR' && this.pedidoIdInput) {
      this.cargarPedidoExistente();
    }
  }

  async cargarDatosSesion() {
    try {
      this.currentEmpresaId = this.authService.getClaim('empresaId');
      this.currentSucursalId = this.authService.getClaim('sucursalId');

      const userResponse = await firstValueFrom(this.userService.getUserMe());
      this.currentUsuarioId = userResponse.user.id;

      // Sincronizar estado de caja
      if (this.currentSucursalId && this.currentUsuarioId) {
        await firstValueFrom(this.cajaService.verificarEstadoCaja(this.currentSucursalId, this.currentUsuarioId));
      }

      console.log('📦 Sesión cargada:', { empresa: this.currentEmpresaId, sucursal: this.currentSucursalId, usuario: this.currentUsuarioId, cajaAbierta: this.cajaService.isCajaAbierta() });
    } catch (e) {
      console.error('❌ Error cargando sesión:', e);
    }
  }

  cargarDatosMaestros() {
    if (!this.currentEmpresaId) return;
    this.categoriaService.getCategoriasByEmpresa(this.currentEmpresaId).subscribe((data: any[]) => {
      this.categorias.set(data.map(c => ({
        ...c,
        id: c.idCategoria,
        nombre: c.nombreCategoria
      })));
    });
    this.productoService.getProductoByEmpresaId(this.currentEmpresaId).subscribe((data: Producto[]) => {
      this.productos.set(data);
      this.aplicarFiltros();
    });
  }

  cargarPedidoExistente() {
    if (!this.pedidoIdInput) return;
    this.pedidoService.seleccionarPedido(this.pedidoIdInput).subscribe(p => {
      this.pedidoExistente.set(p);

      // Mapear los detalles del pedido existente al carrito
      if (p.detalles && p.detalles.length > 0) {
        const itemsDelPedido: CartItem[] = p.detalles.map(d => {
          this.itemsExistentesIds.add(d.id); // Registrar como existente
          return {
            productoId: d.id,           // usamos el detalleId como referencia
            nombre: d.productoNombre,
            precio: d.precioUnitario,
            cantidad: d.cantidad,
            observaciones: d.observaciones || ''
          };
        });
        this.carrito.set(itemsDelPedido);
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
    let lista = this.productos();
    const cat = this.categoriaSeleccionada();
    const term = this.terminoBusqueda();
    if (cat) lista = lista.filter(p => p.idCategoria === cat.id);
    if (term) lista = lista.filter(p => p.nombreProducto.toLowerCase().includes(term));
    this.productosFiltrados.set(lista);
  }

  agregarAlCarrito(producto: Producto) {
    if (this.modoInput === 'EDITAR') {
      // ¿Existe ya en el pedido original (comparando por nombre)?
      const itemExistente = this.carrito().find(
        i => this.itemsExistentesIds.has(i.productoId) && i.nombre === producto.nombreProducto
      );
      if (itemExistente) {
        // En lugar de duplicar, marcar como "modificado" sumando cantidad
        // Para enviarlo al backend como ítem nuevo con la cantidad ADICIONAL
        const idNuevo = producto.idProducto.toString();
        this.carrito.update(prev => {
          const yaAgregado = prev.find(i => i.productoId === idNuevo);
          return yaAgregado
            ? prev.map(i => i.productoId === idNuevo ? { ...i, cantidad: i.cantidad + 1 } : i)
            : [...prev, { productoId: idNuevo, nombre: producto.nombreProducto, precio: producto.precioVenta, cantidad: 1, observaciones: '' }];
        });
        return;
      }
    }

    // Flujo normal: buscar por productoId real
    this.carrito.update(prev => {
      const id = producto.idProducto.toString();
      const ex = prev.find(i => i.productoId === id);
      return ex
        ? prev.map(i => i.productoId === id ? { ...i, cantidad: i.cantidad + 1 } : i)
        : [...prev, { productoId: id, nombre: producto.nombreProducto, precio: producto.precioVenta, cantidad: 1, observaciones: '' }];
    });
  }

  /** Devuelve true si el ítem pertenece al pedido original (no se puede editar/borrar) */
  esItemExistente(productoId: string): boolean {
    return this.itemsExistentesIds.has(productoId);
  }

  updateQuantity(id: string | number, delta: number) {
    // Bloquear cambio de cantidad en ítems del pedido original
    if (this.esItemExistente(id.toString())) return;
    this.carrito.update(prev =>
      prev.map(i => i.productoId === id.toString() ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i)
        .filter(i => i.cantidad > 0)
    );
  }

  eliminarItem(id: string | number) {
    // Bloquear eliminación de ítems del pedido original
    if (this.esItemExistente(id.toString())) return;
    this.carrito.update(prev => prev.filter(i => i.productoId !== id.toString()));
  }

  confirmarPedido() {
    if (this.carrito().length === 0) return;

    console.log('🔍 Validando caja. Estado actual:', this.cajaService.isCajaAbierta());

    if (!this.currentSucursalId || !this.currentUsuarioId) {
      console.error('❌ Error: Datos de sesión incompletos', { sucursal: this.currentSucursalId, usuario: this.currentUsuarioId });
      Swal.fire('Error de Sesión', 'No se pudo recuperar la información de la sucursal o usuario. Reintente iniciando sesión.', 'error');
      return;
    }

    // VALIDACIÓN DE CAJA ABIERTA
    if (!this.cajaService.isCajaAbierta()) {
      Swal.fire({
        title: 'Caja Cerrada',
        text: 'Debe abrir caja para poder registrar pedidos. ¿Ir al módulo de caja?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, ir a caja',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.onCerrar.emit(); // Cerrar el modal actual
          this.router.navigate(['/ventas/caja']);
        }
      });
      return;
    }

    // En modo EDITAR, solo enviamos los ítems NUEVOS (no los pre-cargados del pedido)
    const itemsAEnviar = this.modoInput === 'EDITAR'
      ? this.carrito().filter(i => !this.itemsExistentesIds.has(i.productoId))
      : this.carrito();

    if (this.modoInput === 'EDITAR' && itemsAEnviar.length === 0) {
      Swal.fire('Sin cambios', 'No hay productos nuevos para agregar a la comanda.', 'info');
      return;
    }

    const detalles: PedidoDetalleRequestDto[] = itemsAEnviar.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, observaciones: i.observaciones }));

    const payload = this.modoInput === 'NUEVO'
      ? { tipoEntrega: 'MESA', sucursalId: this.currentSucursalId!, mesaId: this.mesaIdInput, usuarioId: this.currentUsuarioId!, detalles }
      : detalles;

    console.log('🚀 Enviando pedido:', { modo: this.modoInput, payload });

    Swal.fire({
      title: '¿Confirmar envío?',
      text: 'Se enviará la orden a cocina',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745'
    }).then(r => {
      if (r.isConfirmed) {
        const obs = this.modoInput === 'NUEVO'
          ? this.pedidoService.crearPedido(payload as any)
          : this.pedidoService.agregarDetalles(this.pedidoIdInput!, payload as any);

        obs.subscribe({
          next: () => {
            Swal.fire('Éxito', 'Pedido procesado', 'success');
            this.onCerrar.emit();
          },
          error: (err) => {
            const msg = err.error?.message || 'No se pudo procesar el pedido';
            Swal.fire('Error', msg, 'error');
            if (msg.includes('ABRIR CAJA')) {
              this.router.navigate(['/ventas/caja']);
            }
          }
        });
      }
    });
  }

  abrirCobrar() { if (this.pedidoIdInput) this.showCheckout.set(true); }
  abrirDividir() { if (this.pedidoIdInput) this.showDividir.set(true); }
  onCobroFinalizado(e: boolean) { if (e) this.onCerrar.emit(); }
  cerrarModal() { this.onCerrar.emit(); }
}