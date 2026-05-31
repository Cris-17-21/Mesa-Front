import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { PedidoResponseDto } from '../../../../models/venta/pedido.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { SucursalService } from '../../../../services/maestro/sucursal.service';
import { EmpresaService } from '../../../../services/maestro/empresa.service';
import { Sucursal } from '../../../../models/maestro/sucursal.model';
import { Empresa } from '../../../../models/maestro/empresa.model';

@Component({
    selector: 'app-ticket-pre-cuenta',
    standalone: true,
    imports: [CommonModule, DecimalPipe, DatePipe],
    templateUrl: './ticket-pre-cuenta.component.html',
    styleUrl: './ticket-pre-cuenta.component.css'
})
export class TicketPreCuentaComponent implements OnInit {
    pedido = input.required<PedidoResponseDto>();

    private authService = inject(AuthService);
    private sucursalService = inject(SucursalService);
    private empresaService = inject(EmpresaService);

    sucursalData = signal<Sucursal | null>(null);
    empresaData = signal<Empresa | null>(null);

    get igv() {
        return this.pedido().totalFinal * 0.18;
    }

    get subtotal() {
        return this.pedido().totalFinal - this.igv;
    }

    ngOnInit() {
        const branchId = this.pedido().sucursalId || this.authService.getSucursalId();
        if (branchId) {
            this.sucursalService.getOptionalSucursal(branchId).subscribe(s => {
                this.sucursalData.set(s);
            });
        }

        const compId = this.authService.getEmpresaId();
        if (compId) {
            this.empresaService.getOptionalEmpresa(compId).subscribe(e => {
                this.empresaData.set(e);
            });
        }
    }

    print() {
        window.print();
    }
}
