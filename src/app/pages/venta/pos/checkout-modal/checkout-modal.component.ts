import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PedidoService } from '../../../../services/venta/pedido.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { FacturacionService } from '../../../../services/venta/facturacion.service';
import { MetodoPagoService } from '../../../../services/maestro/metodo-pago.service';
import { ClienteService } from '../../../../services/maestro/cliente.service';
import { MetodoPago } from '../../../../models/maestro/metodo-pago.model';
import { TipoComprobante, GenerarComprobanteRequest } from '../../../../models/venta/facturacion.model';
import { Cliente } from '../../../../models/maestro/cliente.model';
import { PagoMixtoItem, PedidoResponseDto, ActualizarPrecioDetalleDto } from '../../../../models/venta/pedido.model';
import { TicketPreCuentaComponent } from '../ticket-pre-cuenta/ticket-pre-cuenta.component';

interface PagoRow {
  metodoId: string;
  nombre: string;
  referencia: string;
  monto: number;
}

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, TicketPreCuentaComponent],
  templateUrl: './checkout-modal.component.html',
  styleUrl: './checkout-modal.component.css'
})
export class CheckoutModalComponent implements OnInit {

  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private facturacionService = inject(FacturacionService);
  private metodoPagoService = inject(MetodoPagoService);
  private clienteService = inject(ClienteService);

  // --- INPUTS / OUTPUTS ---
  @Input({ required: true }) pedidoId!: string;
  @Input({ required: true }) total!: number; // Monto venta base

  @Output() onCancelar = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<boolean>();

  // --- SIGNALS DE ESTADO ---
  currentStep = signal<1 | 2>(1);
  pedido = signal<PedidoResponseDto | null>(null);
  itemsEditables = signal<any[]>([]);
  showTicketPreview = signal<boolean>(false);
  metodosPago = signal<MetodoPago[]>([]);
  pagos = signal<PagoRow[]>([]);
  procesando = signal<boolean>(false);

  // Billing & Document Signals
  tipoComprobante = signal<TipoComprobante>('BOLETA');
  fechaVenta = signal<string>(new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  fechaEmision = signal<string>(new Date().toISOString().split('T')[0]);
  minFecha = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  });
  maxFecha = computed(() => {
    return new Date().toISOString().split('T')[0];
  });
  correlativo = signal<string>('Cargando...');
  impresionConsumo = signal<boolean>(false);
  observacion = signal<string>('');

  onFechaEmisionChange(val: string) {
    this.fechaEmision.set(val);
  }

  onImpresionConsumoChange(val: boolean) {
    this.impresionConsumo.set(val);
    if (val) {
      this.observacion.set('POR CONSUMO DE ALIMENTOS');
    } else if (this.observacion() === 'POR CONSUMO DE ALIMENTOS') {
      this.observacion.set('');
    }
  }

  // Series cargadas desde la API
  seriesDisponibles = signal<any[]>([]);
  serieActual = signal<any | null>(null);

  // Cliente
  clienteDoc = signal<string>('00000000');
  clienteSeleccionado = signal<Cliente | null>(null);

  // Extras
  propina = signal<number>(0);
  recargoConsumo = signal<number>(0);

  // --- COMPUTED ---
  editableTotal = computed(() => {
    return this.itemsEditables().reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  });

  totalVenta = computed(() => {
    if (this.pedido()) {
      return this.editableTotal();
    }
    return this.total;
  });

  totalAPagar = computed(() => this.totalVenta() + this.propina() + this.recargoConsumo());

  totalPagado = computed(() => this.pagos().reduce((acc, p) => acc + p.monto, 0));

  vuelto = computed(() => {
    const pagado = this.totalPagado();
    const total = this.totalAPagar();
    return pagado > total ? pagado - total : 0;
  });

  falta = computed(() => {
    const pagado = this.totalPagado();
    const total = this.totalAPagar();
    const diff = total - pagado;
    return diff > 0 ? diff : 0;
  });

  subtotal = computed(() => this.totalAPagar() / 1.18);
  igv = computed(() => this.totalAPagar() - this.subtotal());

  ngOnInit() {
    this.cargarMetodosPago();
    this.buscarCliente();
    this.cargarSeries();
    this.cargarPedido();
  }

  cargarPedido() {
    this.pedidoService.seleccionarPedido(this.pedidoId).subscribe({
      next: (ped) => {
        this.pedido.set(ped);
        const editableItems = ped.detalles.map(d => ({
          detalleId: d.id,
          productoNombre: d.productoNombre,
          cantidad: d.cantidad,
          precioOriginal: d.precioUnitario,
          precioUnitario: d.precioUnitario,
          totalLinea: d.totalLinea
        }));
        this.itemsEditables.set(editableItems);
      }
    });
  }

  actualizarPrecioItem(index: number, nuevoPrecio: number) {
    this.itemsEditables.update(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index].precioUnitario = nuevoPrecio >= 0 ? nuevoPrecio : 0;
        copy[index].totalLinea = copy[index].precioUnitario * copy[index].cantidad;
      }
      return copy;
    });
  }

  continuarAlCobro() {
    const listDto: ActualizarPrecioDetalleDto[] = this.itemsEditables().map(item => ({
      detalleId: item.detalleId,
      precioUnitario: item.precioUnitario
    }));

    this.procesando.set(true);
    this.pedidoService.actualizarPrecios(this.pedidoId, listDto).subscribe({
      next: (ped) => {
        this.pedido.set(ped);
        this.procesando.set(false);
        this.currentStep.set(2);
        this.setMontoVentaExacto();
      },
      error: (err) => {
        this.procesando.set(false);
        Swal.fire('Error', 'No se pudieron actualizar los precios del pedido.', 'error');
      }
    });
  }

  regresarAPrecios() {
    this.currentStep.set(1);
  }

  imprimirPreCuenta() {
    if (!this.pedido()) return;
    this.showTicketPreview.set(true);
    setTimeout(() => {
      window.print();
      this.showTicketPreview.set(false);
    }, 100);
  }

  cargarSeries() {
    const sucursalId = this.getSucursal().sucursalId;
    if (!sucursalId) {
      this.correlativo.set('Sin sucursal');
      return;
    }
    this.facturacionService.obtenerSeries(sucursalId).subscribe({
      next: (series) => {
        this.seriesDisponibles.set(series);
        this.actualizarSerieActual(this.tipoComprobante());
      },
      error: () => {
        this.correlativo.set('Error al cargar series');
      }
    });
  }

  private actualizarSerieActual(tipo: TipoComprobante) {
    const tipoDocCodigo = tipo === 'FACTURA' ? '01' : tipo === 'BOLETA' ? '03' : '02';
    const serie = this.seriesDisponibles().find(s => s.tipoDocCodigo === tipoDocCodigo);
    this.serieActual.set(serie || null);
    if (serie) {
      const siguiente = (serie.ultimoCorrelativo ?? 0) + 1;
      const numFormateado = String(siguiente).padStart(8, '0');
      this.correlativo.set(`${serie.serie} - ${numFormateado}`);
    } else if (tipo === 'NOTA_VENTA') {
      this.correlativo.set('NV (local)');
    } else {
      this.correlativo.set('⚠ Sin serie configurada');
    }
  }

  cargarMetodosPago() {
    const empresaId = this.authService.getEmpresaId();
    if (empresaId) {
      this.metodoPagoService.getMetodoPagoByEmpresa(empresaId).subscribe({
        next: (data) => {
          this.metodosPago.set(data);
          // Por defecto agregar una fila de Efectivo si existe
          const efectivo = data.find(m => m.esEfectivo) || data[0];
          if (efectivo) {
            this.agregarPago(efectivo);
          }
        }
      });
    }
  }

  buscarCliente() {
    if (!this.clienteDoc()) return;
    this.clienteService.getClienteByDocument(this.clienteDoc()).subscribe({
      next: (cliente) => {
        this.clienteSeleccionado.set(cliente);
      },
      error: () => {
        this.clienteSeleccionado.set(null);
      }
    });
  }

  agregarPago(metodo?: MetodoPago) {
    const m = metodo || this.metodosPago()[0];
    if (!m) return;

    const montoFaltante = this.falta();
    const nuevaFila: PagoRow = {
      metodoId: m.id,
      nombre: m.nombre,
      referencia: '',
      monto: montoFaltante > 0 ? montoFaltante : 0
    };
    this.pagos.update(prev => [...prev, nuevaFila]);
  }

  eliminarPago(index: number) {
    this.pagos.update(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }

  actualizarMontoPago(index: number, monto: number) {
    this.pagos.update(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index].monto = monto;
      }
      return copy;
    });
  }

  actualizarMetodoPagoFila(index: number, metodoId: string) {
    const metodo = this.metodosPago().find(m => m.id === metodoId);
    if (!metodo) return;

    this.pagos.update(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index].metodoId = metodo.id;
        copy[index].nombre = metodo.nombre;
      }
      return copy;
    });
  }

  actualizarEfectivoRapido(monto: number) {
    // Sincroniza el input de "Monto Efectivo" con la primera fila si es Efectivo
    this.pagos.update(prev => {
      const copy = [...prev];
      if (copy[0] && copy[0].nombre.toUpperCase().includes('EFECTIVO')) {
        copy[0].monto = monto;
      } else if (copy.length === 0) {
        // Si no hay filas, agregamos una de efectivo
        const efectivo = this.metodosPago().find(m => m.esEfectivo) || this.metodosPago()[0];
        if (efectivo) {
          copy.push({
            metodoId: efectivo.id,
            nombre: efectivo.nombre,
            referencia: '',
            monto: monto
          });
        }
      }
      return copy;
    });
  }

  cambiarTipoComprobante(tipo: TipoComprobante) {
    this.tipoComprobante.set(tipo);
    this.actualizarSerieActual(tipo);
  }

  setMontoVentaExacto() {
    if (this.pagos().length > 0) {
      this.actualizarMontoPago(0, this.totalAPagar());
    }
  }

  procesarPago() {
    if (this.totalPagado() < this.totalAPagar()) {
      Swal.fire('Monto insuficiente', `Faltan S/ ${this.falta().toFixed(2)}`, 'warning');
      return;
    }

    if (this.tipoComprobante() === 'FACTURA') {
      const doc = this.clienteSeleccionado()?.numeroDocumento || this.clienteDoc();
      if (!doc || doc.trim().length !== 11) {
        Swal.fire('RUC Inválido', 'La factura requiere un cliente con RUC (11 dígitos).', 'warning');
        return;
      }
    }

    this.procesando.set(true);
    const sucursalId = this.getSucursal().sucursalId || '';

    const now = new Date();
    const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const dateIso = `${this.fechaEmision()}T${timePart}`;

    // Emitimos comprobante para todos (BOLETA, FACTURA y NOTA_VENTA) para que el backend lo registre y genere correlativos locales.
    const billingReq: GenerarComprobanteRequest = {
      pedidoId: this.pedidoId,
      tipoComprobante: this.tipoComprobante() as TipoComprobante,
      rucApellidos: this.clienteSeleccionado()?.numeroDocumento || this.clienteDoc(),
      razonSocialNombres: this.clienteSeleccionado()?.nombreRazonSocial || 'CLIENTES VARIOS',
      direccion: this.clienteSeleccionado()?.direccion || '',
      fechaEmision: dateIso,
      impresionConsumo: this.impresionConsumo()
    };

    this.facturacionService.emitirComprobante(billingReq).subscribe({
      next: (res) => {
        this.ejecutarPagoFinal(sucursalId, res);
      },
      error: (err) => {
        console.error(err);
        this.procesando.set(false);
        const errorMsg = err.error?.message || 'No se pudo emitir el comprobante electrónico.';
        Swal.fire('Error Facturación', errorMsg, 'error');
      }
    });
  }

  private ejecutarPagoFinal(sucursalId: string, comprobanteRes?: any) {
    const pagosMixtos: PagoMixtoItem[] = this.pagos().map(p => ({
      medioPagoId: p.metodoId,
      monto: p.monto
    }));

    this.pedidoService.registrarPago(this.pedidoId, pagosMixtos, sucursalId).subscribe({
      next: () => {
        this.procesando.set(false);

        let successHtml = `
          <div style="margin-top: 15px; font-weight: 500; font-size: 0.95rem;">La venta ha sido procesada correctamente.</div>
        `;
        if (comprobanteRes) {
          successHtml += `
            <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px; width: 100%;">
          `;
          if (comprobanteRes.tipoComprobante === '02') {
            successHtml += `
              <button id="btn-ver-txt" class="swal2-confirm swal2-styled" style="background-color: #18181b; margin: 0; padding: 10px; font-size: 0.9rem;">IMPRIMIR TICKET (TXT)</button>
            `;
          } else {
            successHtml += `
              <button id="btn-ver-pdf" class="swal2-confirm swal2-styled" style="background-color: #18181b; margin: 0; padding: 10px; font-size: 0.9rem;">VER PDF (IMPRIMIR)</button>
              <button id="btn-ver-xml" class="swal2-confirm swal2-styled" style="background-color: #71717a; margin: 0; padding: 10px; font-size: 0.9rem;">DESCARGAR XML</button>
            `;
          }
          successHtml += `</div>`;
        }

        Swal.fire({
          title: '¡Pago Exitoso!',
          html: successHtml,
          icon: 'success',
          showConfirmButton: true,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#18181b',
          customClass: {
            popup: 'noir-swal-popup'
          },
          didOpen: () => {
            const btnPdf = document.getElementById('btn-ver-pdf');
            const btnXml = document.getElementById('btn-ver-xml');
            const btnTxt = document.getElementById('btn-ver-txt');

            if (btnPdf) {
              btnPdf.onclick = () => this.facturacionService.abrirPdfEnNuevaPestana(comprobanteRes.archivoPdf);
            }
            if (btnXml) {
              btnXml.onclick = () => window.open(comprobanteRes.archivoXml, '_blank');
            }
            if (btnTxt) {
              btnTxt.onclick = () => {
                const blob = new Blob([comprobanteRes.archivoTxt || ''], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const win = window.open(url, '_blank');
                if (win) {
                  win.onload = () => {
                    win.print();
                  };
                }
              };
            }
          }
        }).then(() => {
          this.onPagoExitoso.emit(true);
        });
      },
      error: (err) => {
        console.error(err);
        this.procesando.set(false);
        Swal.fire('Error', 'No se pudo registrar el pago.', 'error');
      }
    });
  }

  cancelar() {
    this.onCancelar.emit();
  }

  private getSucursal() {
    const token = this.authService.getToken();
    if (!token) return { sucursalId: null };
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { sucursalId: payload.sucursalId };
    } catch (e) { return { sucursalId: null }; }
  }
}

