import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import Swal from 'sweetalert2';
import { PedidoService } from '../../../../services/venta/pedido.service';
import { PedidoDetalleResponseDto, SepararCuentaRequestDto, PedidoResumenDto, PedidoResponseDto } from '../../../../models/venta/pedido.model';
import { CheckoutModalComponent } from '../checkout-modal/checkout-modal.component';

@Component({
  selector: 'app-dividir-cuenta-modal',
  standalone: true,
  imports: [CommonModule, CheckoutModalComponent],
  templateUrl: './dividir-cuenta-modal.component.html',
  styleUrl: './dividir-cuenta-modal.component.css'
})
export class DividirCuentaModalComponent implements OnInit {

  private pedidoService = inject(PedidoService);

  @Input({ required: true }) pedidoId!: string;
  @Output() onCerrar = new EventEmitter<void>();

  // Items cargados del pedido original
  itemsDisponibles = signal<PedidoDetalleResponseDto[]>([]);

  // Mapa de selección: { "detalleId": cantidad_a_separar }
  seleccion = signal<Map<string, number>>(new Map());

  loading = signal(true);
  procesando = signal(false);

  // --- NUEVOS ESTADOS ---
  idCuentaActiva = signal<string>('');
  pedidoActual = signal<PedidoResponseDto | null>(null);
  cuentasMesa = signal<PedidoResumenDto[]>([]);
  showCheckout = signal(false);
  selectedPedidoId = signal<string | null>(null);
  selectedPedidoTotal = signal<number>(0);

  // --- COMPUTED VALUES ---

  // Calcula el total de unidades físicas disponibles para dividir
  totalItemsDisponibles = computed(() => {
    return this.itemsDisponibles().reduce((acc, item) => acc + (item.cantidad - item.cantidadPagada), 0);
  });

  puedeDividir = computed(() => this.totalItemsDisponibles() > 1);

  // Calcula el total en dinero de lo que se está separando
  totalSeparado = computed(() => {
    let total = 0;
    const sel = this.seleccion();
    const items = this.itemsDisponibles();

    sel.forEach((cantidad, detalleId) => {
      const item = items.find(i => i.id === detalleId);
      if (item) {
        total += item.precioUnitario * cantidad;
      }
    });
    return total;
  });

  // Cuenta cuántos items físicos se están separando
  cantidadItemsSeleccionados = computed(() => {
    let count = 0;
    this.seleccion().forEach(qty => count += qty);
    return count;
  });

  ngOnInit() {
    this.idCuentaActiva.set(this.pedidoId);
    this.cargarItemsYFiltros();
  }

  cargarItemsYFiltros() {
    this.loading.set(true);
    const targetId = this.idCuentaActiva();

    // 1. Cargar items del pedido seleccionado
    this.pedidoService.seleccionarPedido(targetId).subscribe({
      next: (pedido) => {
        this.pedidoActual.set(pedido);
        const itemsValidos = pedido.detalles.filter(d => (d.cantidad - d.cantidadPagada) > 0);
        this.itemsDisponibles.set(itemsValidos);

        // 2. Cargar todas las cuentas de la mesa para el listado lateral
        this.actualizarCuentasMesa(pedido.codigoMesa);

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.onCerrar.emit();
      }
    });
  }

  seleccionarCuenta(id: string) {
    if (this.idCuentaActiva() === id) return;

    // Limpiar selección actual antes de cambiar
    this.seleccion.set(new Map());
    this.idCuentaActiva.set(id);
    this.cargarItemsYFiltros();
  }

  actualizarCuentasMesa(codigoMesa: string) {
    const todosActivos = this.pedidoService.pedidosActivos();
    // Filtramos los pedidos que sean de la misma mesa
    const cuentas = todosActivos.filter(p => p.codigoMesa === codigoMesa);
    this.cuentasMesa.set(cuentas);
  }

  // --- LÓGICA DE SELECCIÓN ---

  getMaxSeparable(item: PedidoDetalleResponseDto): number {
    return item.cantidad - item.cantidadPagada;
  }

  incrementar(item: PedidoDetalleResponseDto) {
    const actual = this.seleccion().get(item.id) || 0;
    const max = this.getMaxSeparable(item);

    if (actual < max) {
      this.actualizarSeleccion(item.id, actual + 1);
    }
  }

  decrementar(itemId: string) {
    const actual = this.seleccion().get(itemId) || 0;
    if (actual > 0) {
      this.actualizarSeleccion(itemId, actual - 1);
    }
  }

  toggleTodo(item: PedidoDetalleResponseDto) {
    const actual = this.seleccion().get(item.id) || 0;
    const max = this.getMaxSeparable(item);

    if (actual === max) {
      this.actualizarSeleccion(item.id, 0);
    } else {
      this.actualizarSeleccion(item.id, max);
    }
  }

  private actualizarSeleccion(id: string, cantidad: number) {
    const nuevoMapa = new Map(this.seleccion());
    if (cantidad > 0) {
      nuevoMapa.set(id, cantidad);
    } else {
      nuevoMapa.delete(id);
    }
    this.seleccion.set(nuevoMapa);
  }

  getCantidadSeleccionada(id: string): number {
    return this.seleccion().get(id) || 0;
  }

  // --- ACCIONES DE COBRO ---

  abrirCobrar(pedido: PedidoResumenDto) {
    this.selectedPedidoId.set(pedido.id);
    this.selectedPedidoTotal.set(pedido.totalFinal);
    this.showCheckout.set(true);
  }

  onPagoExitoso(exito: boolean) {
    if (exito) {
      this.showCheckout.set(false);
      // Recargar la mesa para ver qué queda
      this.cargarItemsYFiltros();
    }
  }

  // --- ACCIÓN FINAL (SEPARAR) ---

  confirmarDivision() {
    if (this.cantidadItemsSeleccionados() === 0) return;

    Swal.fire({
      title: '¿Separar cuenta?',
      text: `Se creará una nueva orden por S/ ${this.totalSeparado().toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear nueva orden',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarSeparacion();
      }
    });
  }

  ejecutarSeparacion() {
    this.procesando.set(true);
    const itemsParaDto = Array.from(this.seleccion().entries()).map(([detalleId, cantidad]) => ({
      detalleId: detalleId,
      cantidad: cantidad
    }));

    const dto: SepararCuentaRequestDto = {
      pedidoOrigenId: this.idCuentaActiva(),
      items: itemsParaDto
    };

    this.pedidoService.separarCuenta(dto).subscribe({
      next: (nuevoPedido) => {
        this.procesando.set(false);
        this.seleccion.set(new Map()); // Limpiar selección

        Swal.fire({
          title: '¡Cuenta Separada!',
          text: `Se ha creado el pedido #${nuevoPedido.codigoPedido} correctamente.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // En lugar de cerrar, recargamos para ver la nueva cuenta a la derecha
        this.cargarItemsYFiltros();
      },
      error: (err) => {
        console.error(err);
        this.procesando.set(false);
        Swal.fire('Error', 'No se pudo dividir la cuenta.', 'error');
      }
    });
  }
}
