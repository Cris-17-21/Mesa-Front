import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovimientoCajaService } from '../../../../services/venta/movimiento-caja.service';
import { CreateMovimientoCajaRequest, TipoMovimiento } from '../../../../models/venta/caja-movimiento';
import Swal from 'sweetalert2';
import { CajaService } from '../../../../services/venta/caja.service';

@Component({
  selector: 'app-caja-movimiento-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputNumberModule, InputTextModule, TextareaModule, SelectButtonModule],
  templateUrl: './caja-movimiento-modal.component.html',
  styleUrl: './caja-movimiento-modal.component.css'
})
export class CajaMovimientoModalComponent {

  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoCajaService); // Usamos tu servicio específico
  private cajaService = inject(CajaService);

  @Input() visible = false;
  @Input() usuarioId: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  loading = signal(false);

  // Opciones para el botón de selección (Value debe coincidir con el tipo 'INGRESO' | 'EGRESO')
  tiposMovimiento: { label: string, value: TipoMovimiento, icon: string }[] = [
    { label: 'Salida (Gasto)', value: 'EGRESO', icon: 'bi bi-arrow-up-right' },
    { label: 'Entrada Dinero', value: 'INGRESO', icon: 'bi bi-arrow-down-left' }
  ];

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      tipo: ['EGRESO', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.10)]],
      descripcion: ['', [Validators.required, Validators.minLength(3)]] // Un solo campo descripcion
    });
  }

  submit() {
    // Validaciones básicas
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const val = this.form.value;
    const currenteCajaId = this.cajaService.cajaIdActual();

    if (!currenteCajaId) {
      Swal.fire('Error', 'No se ha identificado la caja activa', 'error');
      return;
    }

    // Construimos el Payload exacto que pide tu backend
    const payload: CreateMovimientoCajaRequest = {
      cajaId: currenteCajaId, // Mapeamos el ID recibido
      tipo: val.tipo,
      monto: val.monto,
      descripcion: val.descripcion,
      usuarioId: this.usuarioId || ''
    };

    console.log(payload);

    this.movimientoService.registrarMovimiento(payload).subscribe({
      next: () => {
        this.showSuccess();
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        // Muestra mensaje del backend si existe, sino un genérico
        const msg = err.error?.message || 'No se pudo registrar el movimiento';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  private showSuccess() {
    this.loading.set(false);
    Swal.fire({
      icon: 'success',
      title: 'Registrado',
      text: 'Movimiento guardado correctamente',
      timer: 1500,
      showConfirmButton: false
    });

    // Resetear formulario manteniendo el tipo 'EGRESO' por comodidad
    this.form.reset({ tipo: 'EGRESO' });

    this.onSave.emit(); // Avisar al padre para actualizar
    this.close();
  }

  close() {
    this.visibleChange.emit(false);
  }
}
