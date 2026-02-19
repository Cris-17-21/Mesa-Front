import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- PrimeNG ---
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// --- Componentes ---
import { OrdenComponent } from '../orden/orden.component';

// --- Servicios y Modelos ---
import { MesaService } from '../../../../services/maestro/mesa.service';
import { PedidoService } from '../../../../services/venta/pedido.service';
import { PisoService } from '../../../../services/maestro/piso.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Mesa } from '../../../../models/maestro/mesa.model';
import { Piso } from '../../../../models/maestro/piso.model';
import { UnionMesaRequestDto } from '../../../../models/venta/pedido.model';

// --- Utils ---
import Swal from 'sweetalert2';

@Component({
  selector: 'app-piso-mapa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    ButtonModule,
    TooltipModule,
    OrdenComponent
  ],
  templateUrl: './piso-mapa.component.html',
  styleUrl: './piso-mapa.component.css'
})
export class PisoMapaComponent implements OnInit {

  // --- Inyecciones ---
  private mesaService = inject(MesaService);
  private pedidoService = inject(PedidoService);
  private pisoService = inject(PisoService);
  private authService = inject(AuthService);

  // --- Señales de Estado ---
  pisos = signal<Piso[]>([]);
  mesas = signal<Mesa[]>([]);
  pisoSeleccionado = signal<string | null>(null);
  sucursalId = signal<string | null>(null);

  // --- Control de Modales ---
  mesaSeleccionadaParaModal = signal<any>(null); // Mesa actual para el modal de orden

  // --- Control de Unión de Mesas ---
  modoUnion = signal(false);
  seleccionUnion = signal<string[]>([]);

  // --- COMPUTED: Lógica Visual (Colores y Estados) ---
  mesasView = computed(() => {
    const listaMesas = this.mesas();
    const listaPedidos = this.pedidoService.pedidosActivos();

    return listaMesas.map(mesa => {
      // 1. Detectar si es hija (unida) y buscar a su padre
      const esUnida = !!mesa.idPrincipal;
      let nombreMesaPadre = '';

      if (esUnida) {
        // Buscamos en la lista de mesas cuál es la mesa "papá"
        const mesaPadre = listaMesas.find(m => m.id === mesa.idPrincipal);
        nombreMesaPadre = mesaPadre ? mesaPadre.codigoMesa : 'Principal';
      }

      // 2. Determinar ID para buscar el pedido
      const idParaBuscar = mesa.idPrincipal ? mesa.idPrincipal : mesa.id;

      const pedidoActivo = listaPedidos.find(p =>
        p.mesaId === idParaBuscar || p.codigoMesa === mesa.codigoMesa
      );

      const esOcupada = !!pedidoActivo;

      return {
        ...mesa,
        esOcupada,
        esUnida,
        nombreMesaPadre,

        // Estilos
        bgStyle: esOcupada ? '#fff5f5' : '#ffffff',
        textStyle: esOcupada ? '#dc3545' : '#198754',

        pedidoId: pedidoActivo ? pedidoActivo.id : null,   // ← el fix: ID del pedido activo
        total: pedidoActivo ? pedidoActivo.totalFinal : 0,
        idTrack: mesa.id || mesa.codigoMesa
      };
    });
  });

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  // --- Carga de Datos ---
  cargarDatosIniciales() {
    const sucursal = this.getSucursal();
    if (!sucursal.sucursalId) return;

    this.sucursalId.set(sucursal.sucursalId);

    // 1. Cargar Pisos
    this.pisoService.getPisosBySucursal(sucursal.sucursalId).subscribe({
      next: (pisosData) => {
        this.pisos.set(pisosData);

        // Autoselección
        if (pisosData.length > 0 && !this.pisoSeleccionado()) {
          this.seleccionarPiso(pisosData[0].id);
        } else if (this.pisoSeleccionado()) {
          this.cargarMesas(this.pisoSeleccionado()!);
        }
      },
      error: (err) => console.error('Error cargando pisos', err)
    });

    // 2. Actualizar pedidos activos (para pintar las mesas ocupadas)
    this.pedidoService.listarActivos(sucursal.sucursalId).subscribe();
  }

  onPisoChange(event: any) {
    this.seleccionarPiso(event.value);
  }

  seleccionarPiso(pisoId: string) {
    this.pisoSeleccionado.set(pisoId);
    this.cargarMesas(pisoId);
  }

  cargarMesas(pisoId: string) {
    this.mesaService.getMesasByPiso(pisoId).subscribe({
      next: (data) => this.mesas.set(data),
      error: (err) => console.error('Error cargando mesas', err)
    });
  }

  // --- Interacción con Mesas ---
  onMesaClick(mesa: any) {
    // A: Modo Unión Activado
    if (this.modoUnion()) {
      this.toggleSeleccionUnion(mesa);
      return;
    }

    // B: Modo Normal -> Abrir Modal Orden
    this.mesaSeleccionadaParaModal.set(mesa);
  }

  cerrarModalOrden() {
    this.mesaSeleccionadaParaModal.set(null);
    // Recargar para ver cambios de estado (Libre -> Ocupada)
    this.cargarDatosIniciales();
  }

  // --- Lógica de Unión ---
  toggleModoUnion() {
    this.modoUnion.update(v => !v);
    this.seleccionUnion.set([]); // Limpiar selección al entrar/salir
  }

  toggleSeleccionUnion(mesa: any) {
    this.seleccionUnion.update(prev => {
      if (prev.includes(mesa.id)) {
        return prev.filter(id => id !== mesa.id);
      } else {
        return [...prev, mesa.id];
      }
    });
  }

  confirmarUnion() {
    const seleccion = this.seleccionUnion();

    if (seleccion.length < 2) {
      Swal.fire('Atención', 'Selecciona al menos 2 mesas para unir.', 'warning');
      return;
    }

    const [mesaPrincipalId, ...mesasSecundarias] = seleccion;

    Swal.fire({
      title: '¿Unir Mesas?',
      text: `Se unirán las mesas seleccionadas a la primera seleccionada.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, unir',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarUnion(mesaPrincipalId, mesasSecundarias[0]); // Asumiendo unión de pares por ahora
      }
    });
  }

  private ejecutarUnion(principalId: string, secundariaId: string) {
    const sucursalId = this.sucursalId();
    if (!sucursalId) return;

    const dto: UnionMesaRequestDto = {
      idPrincipal: principalId,
      idsSecundarios: [secundariaId]
    };

    this.pedidoService.unirMesas(dto, sucursalId).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Mesas unidas correctamente', 'success');
        this.toggleModoUnion();
        this.cargarDatosIniciales(); // Refrescar mapa
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo unir las mesas.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  // --- Utilidades ---
  private getSucursal() {
    const token = this.authService.getToken();
    if (!token) return { sucursalId: null };
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { sucursalId: payload.sucursalId };
    } catch (e) {
      return { sucursalId: null };
    }
  }
}