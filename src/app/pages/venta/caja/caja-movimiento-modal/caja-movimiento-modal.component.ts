import {
  Component,
  inject,
  signal,
  effect,
  model,
  input,
  output
} from '@angular/core';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';

// Forms
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

// Servicios
import { MovimientoCajaService } from '../../../../services/venta/movimiento-caja.service';
import { CajaService } from '../../../../services/venta/caja.service';

// Modelos
import {
  CreateMovimientoCajaRequest,
  TipoMovimiento
} from '../../../../models/venta/caja-movimiento';

import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-caja-movimiento-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    SelectButtonModule
  ],
  templateUrl: './caja-movimiento-modal.component.html',
  styleUrl: './caja-movimiento-modal.component.css'
})
export class CajaMovimientoModalComponent {

  // ===============================
  // Inyección moderna
  // ===============================

  private fb = inject(FormBuilder);
  private movimientoService = inject(MovimientoCajaService);
  private cajaService = inject(CajaService);

  // ===============================
  // Inputs / Outputs modernos
  // ===============================

  visible = model<boolean>(false);
  usuarioId = input<string | null>(null);
  onSave = output<void>();

  // ===============================
  // Estado UI
  // ===============================

  loading = signal(false);

  tiposMovimiento: {
    label: string;
    value: TipoMovimiento;
    icon: string;
  }[] = [
      { label: 'Salida (Gasto)', value: 'EGRESO', icon: 'bi bi-arrow-up-right' },
      { label: 'Entrada Dinero', value: 'INGRESO', icon: 'bi bi-arrow-down-left' }
    ];

  form: FormGroup = this.fb.group({
    tipo: ['EGRESO', Validators.required],
    monto: [null, [Validators.required, Validators.min(0.10)]],
    descripcion: ['', [Validators.required]]
  });

  // ===============================
  // Reset automático al abrir
  // ===============================

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.form.reset({ tipo: 'EGRESO' });
        this.loading.set(false);
      }
    });
  }

  // ===============================
  // Submit
  // ===============================

  submit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const cajaId = this.cajaService.cajaIdActual();

    if (!cajaId) {
      Swal.fire('Error', 'No se ha identificado la caja activa', 'error');
      return;
    }

    this.loading.set(true);

    const { tipo, monto, descripcion } = this.form.value;

    const payload: CreateMovimientoCajaRequest = {
      cajaId,
      tipo,
      monto,
      descripcion,
      usuarioId: this.usuarioId() ?? ''
    };

    this.movimientoService.registrarMovimiento(payload).subscribe({
      next: () => this.handleSuccess(),
      error: (err) => {
        this.loading.set(false);
        Swal.fire(
          'Error',
          err?.error?.message ?? 'No se pudo registrar el movimiento',
          'error'
        );
      }
    });
  }

  // ===============================
  // Éxito
  // ===============================

  private handleSuccess() {
    this.loading.set(false);

    Swal.fire({
      icon: 'success',
      title: 'Registrado',
      text: 'Movimiento guardado correctamente',
      timer: 1500,
      showConfirmButton: false
    });

    this.onSave.emit();
    this.visible.set(false);
  }

}