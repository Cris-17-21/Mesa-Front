import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CompraService } from '../../services/compra.service';
import { Compra } from '../../models/compra.model';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-compra-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        CardModule
    ],
    templateUrl: './compra-list.component.html',
    styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CompraListComponent implements OnInit {
    private compraService = inject(CompraService);
    private router = inject(Router);

    compras: Compra[] = [];
    loading: boolean = true;

    ngOnInit() {
        this.loadCompras();
    }

    loadCompras() {
        this.loading = true;
        this.compraService.getCompras().subscribe({
            next: (data) => {
                this.compras = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error cargando compras', err);
                this.loading = false;
            }
        });
    }

    createCompra() {
        this.router.navigate(['/compras/nuevo']);
    }

    getSeverity(estado: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
        switch (estado) {
            case 'PAGADO':
                return 'success';
            case 'PENDIENTE':
                return 'warning';
            case 'ANULADO':
                return 'danger';
            default:
                return 'info';
        }
    }
}
