import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { InventarioService, InventarioDto, MovimientoRequest } from '../../../../services/inventario/inventario.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-movimiento-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, InputTextModule, DropdownModule, FormsModule],
  template: `
    <p-dialog [header]="tipo === 'ENTRADA' ? 'Registrar Entrada' : 'Registrar Salida'" [(visible)]="visible" [modal]="true" [style]="{width: '50vw', maxWidth: '600px'}">
        <div class="flex flex-column gap-3 py-3" *ngIf="request">
            
            <div class="flex flex-column gap-2">
                <label for="producto">Producto</label>
                <p-dropdown id="producto" [options]="productos" [(ngModel)]="request.idProducto" optionLabel="nombreProducto" optionValue="idProducto" placeholder="Selecciona un producto" [filter]="true" filterBy="nombreProducto"></p-dropdown>
            </div>

            <div class="flex flex-column gap-2">
                <label for="motivo">Motivo</label>
                <p-dropdown id="motivo" [options]="motivos" [(ngModel)]="request.motivo" placeholder="Selecciona el motivo"></p-dropdown>
            </div>

            <div class="flex flex-column gap-2">
                <label for="cantidad">Cantidad</label>
                <input id="cantidad" type="number" pInputText [(ngModel)]="request.cantidad" min="1" class="w-full form-control">
            </div>

            <div class="flex flex-column gap-2">
                <label for="comprobante">Comprobante / Referencia (Opcional)</label>
                <input id="comprobante" type="text" pInputText [(ngModel)]="request.comprobante" class="w-full form-control">
            </div>

        </div>

        <ng-template pTemplate="footer">
            <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="visible = false"></p-button>
            <p-button label="Guardar" icon="pi pi-check" (onClick)="guardar()" [disabled]="!esValido()"></p-button>
        </ng-template>
    </p-dialog>
  `
})
export class MovimientoModalComponent {
  inventarioService: InventarioService = inject(InventarioService);
  authService: AuthService = inject(AuthService);
  messageService: MessageService = inject(MessageService);

  @Input() productos: InventarioDto[] = [];
  @Output() onSaved = new EventEmitter<void>();

  visible = false;
  tipo: 'ENTRADA' | 'SALIDA' = 'ENTRADA';
  
  motivos: string[] = [];
  request: Partial<MovimientoRequest> = {};

  async abrir(tipo: 'ENTRADA' | 'SALIDA') {
    this.tipo = tipo;
    this.motivos = tipo === 'ENTRADA' ? ['COMPRA', 'INVENTARIO_INICIAL', 'AJUSTE_POSITIVO', 'DEVOLUCION'] : ['MERMA', 'USO_INTERNO', 'AJUSTE_NEGATIVO'];
    
    this.request = {
      tipoMovimiento: tipo,
      cantidad: 1,
      sucursalId: this.authService.getSucursalId(),
      usuarioId: await this.authService.getUserId(),
      motivo: this.motivos[0],
      comprobante: ''
    };
    
    this.visible = true;
  }

  esValido(): boolean {
    return !!(this.request.idProducto && this.request.motivo && this.request.cantidad && this.request.cantidad > 0);
  }

  guardar() {
    if (!this.esValido()) return;

    this.inventarioService.registrarMovimiento(this.request as MovimientoRequest).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Movimiento registrado correctamente' });
        this.visible = false;
        this.onSaved.emit();
      },
      error: (err: any) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo registrar el movimiento' });
      }
    });
  }
}
