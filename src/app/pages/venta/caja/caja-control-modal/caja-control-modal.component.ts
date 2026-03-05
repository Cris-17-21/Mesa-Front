import { Component, inject, signal, input, output, model, WritableSignal, DestroyRef, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

// Servicios
import { CajaService } from '../../../../services/venta/caja.service';
import { AbrirCajaDto, CerrarCajaDto } from '../../../../models/venta/caja.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-caja-control-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule
  ],
  templateUrl: './caja-control-modal.component.html',
  styleUrl: './caja-control-modal.component.css'
})
export class CajaControlModalComponent {

  private fb: NonNullableFormBuilder = inject(NonNullableFormBuilder);
  private cajaService = inject(CajaService);
  private destroyRef = inject(DestroyRef);

  // SIGNAL INPUTS (modern)
  visible = model<boolean>(false);
  type = input<'OPEN' | 'CLOSE'>('OPEN');
  cajaActivaId = input<string | null>(null);
  saldoEsperado = input<number>(0);
  sucursalId = input<string | null>(null);
  usuarioId = input<string | null>(null);

  // OUTPUT
  saved = output<void>();

  // FORM
  form = this.fb.group({
    monto: [0, [Validators.required, Validators.min(0)]],
    observacion: ['']
  });

  // REACTIVE STATE (Derived from Form)
  private montoSignal = toSignal(this.form.controls.monto.valueChanges, { initialValue: 0 });

  diferencia = computed(() => {
    if (this.type() !== 'CLOSE') return 0;
    const monto = this.montoSignal() ?? 0;
    return monto - this.saldoEsperado();
  });

  // STATE
  loading = signal(false);

  constructor() { }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { monto, observacion } = this.form.getRawValue();

    if (this.type() === 'OPEN') {
      this.abrirCaja(monto);
    } else {
      this.cerrarCaja(monto, observacion);
    }
  }

  private abrirCaja(monto: number): void {
    if (!this.sucursalId() || !this.usuarioId()) {
      this.showError('Faltan datos de sesión');
      return;
    }

    const payload: AbrirCajaDto = {
      sucursalId: this.sucursalId()!,
      usuarioId: this.usuarioId()!,
      montoApertura: monto
    };

    this.cajaService.abrirCaja(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.success('Turno abierto correctamente'),
        error: (e) => this.showError(e)
      });
  }

  private cerrarCaja(monto: number, observacion: string): void {
    if (!this.cajaActivaId()) {
      this.showError('No hay caja activa');
      return;
    }

    const payload: CerrarCajaDto = {
      id: this.cajaActivaId()!,
      efectivoReal: monto,
      tarjetaReal: 0,
      comentario: observacion ?? ''
    };

    this.cajaService.cerrarCaja(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.success('Turno cerrado correctamente'),
        error: (e) => this.showError(e)
      });
  }

  private success(message: string): void {
    this.loading.set(false);

    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
      confirmButtonColor: '#18181b',
      timer: 1500,
      showConfirmButton: false
    });

    this.saved.emit();
    this.visible.set(false);
  }

  private showError(error: unknown): void {
    this.loading.set(false);

    const msg =
      typeof error === 'string'
        ? error
        : (error as any)?.error?.message ?? 'Ocurrió un error inesperado';

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: msg,
      confirmButtonColor: '#18181b'
    });
  }
}