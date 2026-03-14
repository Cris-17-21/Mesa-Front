import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturacionService } from '../../../services/venta/facturacion.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ComprobanteResponse } from '../../../models/venta/facturacion.model';

@Component({
    selector: 'app-facturacion-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './facturacion-history.component.html',
    styleUrl: './facturacion-history.component.css'
})
export class FacturacionHistoryComponent implements OnInit {
    private facturacionService = inject(FacturacionService);
    private authService = inject(AuthService);

    comprobantes = signal<ComprobanteResponse[]>([]);
    cargando = signal<boolean>(false);

    ngOnInit() {
        this.cargarHistorial();
    }

    cargarHistorial() {
        const sucursalId = this.getSucursalId();
        if (!sucursalId) return;

        this.cargando.set(true);
        this.facturacionService.listarComprobantes(sucursalId).subscribe({
            next: (data) => {
                this.comprobantes.set(data);
                this.cargando.set(false);
            },
            error: (err: any) => this.cargando.set(false)
        });
    }

    verPdf(url: string) {
        window.open(url, '_blank', 'noopener');
    }

    descargarXml(url: string) {
        window.open(url, '_blank');
    }

    private getSucursalId(): string | null {
        const token = this.authService.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sucursalId;
        } catch (e: any) { return null; }
    }
}
