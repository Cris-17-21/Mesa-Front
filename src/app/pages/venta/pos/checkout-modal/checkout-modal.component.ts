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

interface PagoRow {
  metodoId: string;
  nombre: string;
  referencia: string;
  monto: number;
}

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
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
  metodosPago = signal<MetodoPago[]>([]);
  pagos = signal<PagoRow[]>([]);
  procesando = signal<boolean>(false);

  // Billing & Document Signals
  tipoComprobante = signal<TipoComprobante | 'NOTA_VENTA'>('BOLETA');
  fechaVenta = signal<string>(new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  correlativo = signal<string>('B001 - 1884');
  impresionConsumo = signal<boolean>(false);
  observacion = signal<string>('');

  // Cliente
  clienteDoc = signal<string>('00000000');
  clienteSeleccionado = signal<Cliente | null>(null);

  // Extras
  propina = signal<number>(0);
  recargoConsumo = signal<number>(0);

  // --- COMPUTED ---
  totalAPagar = computed(() => this.total + this.propina() + this.recargoConsumo());

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

  cambiarTipoComprobante(tipo: TipoComprobante | 'NOTA_VENTA') {
    this.tipoComprobante.set(tipo);
    // Prefijos simulados para el diseño
    if (tipo === 'FACTURA') this.correlativo.set('F001 - 0452');
    else if (tipo === 'BOLETA') this.correlativo.set('B001 - 1884');
    else this.correlativo.set('NV01 - 0982');
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

    if (this.tipoComprobante() === 'FACTURA' && (!this.clienteSeleccionado() || this.clienteDoc().length !== 11)) {
      Swal.fire('RUC Inválido', 'La factura requiere un cliente con RUC (11 dígitos).', 'warning');
      return;
    }

    this.procesando.set(true);
    const sucursalId = this.getSucursal().sucursalId || '';

    if (this.tipoComprobante() === 'BOLETA' || this.tipoComprobante() === 'FACTURA') {
      const billingReq: GenerarComprobanteRequest = {
        pedidoId: this.pedidoId,
        tipoComprobante: this.tipoComprobante() as TipoComprobante,
        rucApellidos: this.clienteSeleccionado()?.numeroDocumento || this.clienteDoc(),
        razonSocialNombres: this.clienteSeleccionado()?.nombreRazonSocial || 'CLIENTES VARIOS',
        direccion: this.clienteSeleccionado()?.direccion || ''
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
    } else {
      this.ejecutarPagoFinal(sucursalId);
    }
  }

  private ejecutarPagoFinal(sucursalId: string, comprobanteRes?: any) {
    const metodosUnicos = [...new Set(this.pagos().map(p => p.nombre))];
    const metodoString = metodosUnicos.join(', ');

    this.pedidoService.registrarPago(this.pedidoId, metodoString, sucursalId).subscribe({
      next: () => {
        this.procesando.set(false);

        let successHtml = 'La venta ha sido procesada correctamente.';
        if (comprobanteRes) {
          successHtml += `
            <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
              <button id="btn-ver-pdf" class="swal2-confirm swal2-styled" style="background-color: #e74c3c;">VER PDF (IMPRIMIR)</button>
              <button id="btn-ver-xml" class="swal2-confirm swal2-styled" style="background-color: #2ecc71;">DESCARGAR XML</button>
            </div>
          `;
        }

        Swal.fire({
          title: '¡Pago Exitoso!',
          html: successHtml,
          icon: 'success',
          showConfirmButton: true,
          confirmButtonText: 'Cerrar',
          didOpen: () => {
            const btnPdf = document.getElementById('btn-ver-pdf');
            const btnXml = document.getElementById('btn-ver-xml');

            if (btnPdf) {
              btnPdf.onclick = () => this.facturacionService.abrirPdfEnNuevaPestana(comprobanteRes.archivoPdf);
            }
            if (btnXml) {
              btnXml.onclick = () => window.open(comprobanteRes.archivoXml, '_blank');
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

