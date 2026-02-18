import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MesaService } from '../../../../services/maestro/mesa.service';
import { PedidoService } from '../../../../services/venta/pedido.service';
import { Mesa } from '../../../../models/maestro/mesa.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-piso-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './piso-mapa.component.html',
  styleUrl: './piso-mapa.component.css'
})
export class PisoMapaComponent implements OnInit {

  private router = inject(Router);
  private mesaService = inject(MesaService);
  private pedidoService = inject(PedidoService);

  // ESTADO
  mesas = signal<Mesa[]>([]);
  pisoIdActual = signal<string>('ID_DE_TU_PISO_AQUI'); // ⚠️ DEBES PONER UN ID REAL O OBTENERLO DE UN SELECTOR

  // MODO UNIÓN
  modoUnion = signal(false);
  seleccionUnion = signal<string[]>([]); // IDs de mesas seleccionadas para unir

  // COMPUTED: Cruzamos Mesas con Pedidos Activos
  // Esto nos permite saber qué mesa tiene qué pedido y cuánto dinero lleva
  mesasView = computed(() => {
    const listaMesas = this.mesas();
    const listaPedidos = this.pedidoService.pedidosActivos();

    return listaMesas.map(mesa => {
      // Buscamos si hay un pedido activo para esta mesa (match por Código de Mesa)
      const pedidoActivo = listaPedidos.find(p => p.codigoMesa === mesa.codigoMesa);

      return {
        ...mesa,
        esOcupada: !!pedidoActivo || mesa.estado === 'OCUPADA',
        pedidoId: pedidoActivo?.id,
        total: pedidoActivo?.totalFinal || 0,
        cliente: pedidoActivo?.nombreCliente || 'Cliente'
      };
    });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Obtener Mesas del Piso (Asegúrate de tener un ID de piso válido)
    this.mesaService.getMesasByPiso(this.pisoIdActual()).subscribe({
      next: (data) => this.mesas.set(data),
      error: (err) => console.error('Error cargando mesas', err)
    });

    // 2. Obtener Pedidos Activos (Necesitas el ID de la sucursal del usuario logueado)
    const sucursalId = 'ID_SUCURSAL_USER'; // ⚠️ OBTENER DEL AUTH SERVICE
    this.pedidoService.listarActivos(sucursalId).subscribe();
  }

  // =========================================================
  // LOGICA DE INTERACCIÓN (CLIC EN MESA)
  // =========================================================
  onMesaClick(mesa: any) {

    // --- MODO UNIÓN ---
    if (this.modoUnion()) {
      this.toggleSeleccionUnion(mesa);
      return;
    }

    // --- MODO NORMAL ---
    if (mesa.esOcupada && mesa.pedidoId) {
      // 1. Mesa Ocupada -> IR A EDITAR PEDIDO
      this.router.navigate(['/pos'], {
        queryParams: {
          mesaId: mesa.id,
          pedidoId: mesa.pedidoId,
          modo: 'EDITAR'
        }
      });
    } else {
      // 2. Mesa Libre -> IR A CREAR PEDIDO
      this.router.navigate(['/pos'], {
        queryParams: {
          mesaId: mesa.id,
          modo: 'NUEVO'
        }
      });
    }
  }

  // =========================================================
  // LOGICA DE UNIÓN DE MESAS
  // =========================================================
  toggleModoUnion() {
    this.modoUnion.update(v => !v);
    this.seleccionUnion.set([]); // Limpiar selección al cambiar modo
  }

  toggleSeleccionUnion(mesa: any) {
    // Solo permitir seleccionar si tienen el mismo estado (o lógica que prefieras)
    this.seleccionUnion.update(prev => {
      if (prev.includes(mesa.id)) {
        return prev.filter(id => id !== mesa.id); // Deseleccionar
      } else {
        return [...prev, mesa.id]; // Seleccionar
      }
    });
  }

  confirmarUnion() {
    const seleccion = this.seleccionUnion();
    if (seleccion.length < 2) {
      Swal.fire('Atención', 'Selecciona al menos 2 mesas para unir', 'warning');
      return;
    }

    // La primera seleccionada será la PRINCIPAL (a donde se mueve todo)
    const [idPrincipal, ...idsSecundarios] = seleccion;

    Swal.fire({
      title: '¿Unir Mesas?',
      text: `Se unificarán ${idsSecundarios.length} mesas a la principal.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, unir'
    }).then((result) => {
      if (result.isConfirmed) {

        // Llamamos al servicio de MesaService (o PedidoService según tu backend)
        // Usando tu interfaz UnionMesa
        const sucursalId = 'ID_SUCURSAL_USER'; // ⚠️

        const dto = {
          idPrincipal: idPrincipal,
          idsSecundarios: idsSecundarios
        };

        // NOTA: Usamos PedidoService si es para unir cuentas, 
        // o MesaService si es unión física. Usaré PedidoService según tu código anterior.
        this.pedidoService.unirMesas(dto, sucursalId).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Mesas unidas correctamente', 'success');
            this.toggleModoUnion(); // Salir del modo
            this.cargarDatos(); // Recargar mapa
          },
          error: () => Swal.fire('Error', 'No se pudo unir las mesas', 'error')
        });
      }
    });
  }
}
