import { Component, inject, signal, input, output, model, DestroyRef, computed, effect } from '@angular/core';
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
import { AbrirCajaDto, CerrarCajaDto, CajaResumenDto } from '../../../../models/venta/caja.model';
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

  // SIGNAL INPUTS
  visible = model<boolean>(false);
  type = input<'OPEN' | 'CLOSE'>('OPEN');
  cajaActivaId = input<string | null>(null);
  arqueo = input<CajaResumenDto | null>(null);  // Para mostrar valores esperados al cerrar
  sucursalId = input<string | null>(null);
  usuarioId = input<string | null>(null);

  // OUTPUT
  saved = output<void>();

  // ================================================================
  // FORMULARIO — Apertura (2 campos) y Cierre (4 campos + observación)
  // ================================================================
  form = this.fb.group({
    // Apertura
    efectivoApertura: [0, [Validators.min(0)]],
    virtualApertura:  [0, [Validators.min(0)]],
    // Cierre
    efectivoCierreReal: [0, [Validators.min(0)]],
    virtualCierreReal:  [0, [Validators.min(0)]],
    // Observaciones (cierre)
    observacion: ['']
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.form.reset({
          efectivoApertura: 0,
          virtualApertura: 0,
          efectivoCierreReal: 0,
          virtualCierreReal: 0,
          observacion: ''
        });
      }
    });
  }

  // ================================================================
  // COMPUTED — Diferencia en tiempo real para el cierre
  // ================================================================

  private efectivoCierreRealSignal = toSignal(
    this.form.controls.efectivoCierreReal.valueChanges, { initialValue: 0 }
  );
  private virtualCierreRealSignal = toSignal(
    this.form.controls.virtualCierreReal.valueChanges, { initialValue: 0 }
  );

  efectivoEsperado = computed(() => this.arqueo()?.saldoEsperadoEnCaja ?? 0);
  virtualEsperado  = computed(() => this.arqueo()?.saldoEsperadoVirtual ?? 0);

  diferenciaEfectivo = computed(() => {
    if (this.type() !== 'CLOSE') return 0;
    return (this.efectivoCierreRealSignal() ?? 0) - this.efectivoEsperado();
  });

  diferenciaVirtual = computed(() => {
    if (this.type() !== 'CLOSE') return 0;
    return (this.virtualCierreRealSignal() ?? 0) - this.virtualEsperado();
  });

  hayDiferencia = computed(() =>
    Math.abs(this.diferenciaEfectivo()) > 0.01 || Math.abs(this.diferenciaVirtual()) > 0.01
  );

  // STATE
  loading = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.type() === 'CLOSE' && this.hayDiferencia() && !this.form.value.observacion?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Observación requerida',
        text: 'Hay diferencia en el arqueo. Debes indicar el motivo en las observaciones.',
        confirmButtonColor: '#18181b'
      });
      return;
    }

    this.loading.set(true);

    if (this.type() === 'OPEN') {
      this.abrirCaja();
    } else {
      this.cerrarCaja();
    }
  }

  private abrirCaja(): void {
    if (!this.sucursalId() || !this.usuarioId()) {
      this.showError('Faltan datos de sesión');
      return;
    }

    const { efectivoApertura, virtualApertura } = this.form.getRawValue();
    const ef = efectivoApertura ?? 0;
    const vir = virtualApertura ?? 0;

    const payload: AbrirCajaDto = {
      sucursalId: this.sucursalId()!,
      usuarioId: this.usuarioId()!,
      montoAperturaEfectivo: ef,
      montoAperturaVirtual: vir,
      montoApertura: ef + vir
    };

    this.cajaService.abrirCaja(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.success('Turno abierto correctamente'),
        error: (e) => this.showError(e)
      });
  }

  private cerrarCaja(): void {
    if (!this.cajaActivaId()) {
      this.showError('No hay caja activa');
      return;
    }

    const { efectivoCierreReal, virtualCierreReal, observacion } = this.form.getRawValue();

    const payload: CerrarCajaDto = {
      id: this.cajaActivaId()!,
      efectivoCierreReal: efectivoCierreReal ?? 0,
      virtualCierreReal: virtualCierreReal ?? 0,
      efectivoCierreEsperado: this.efectivoEsperado(),
      virtualCierreEsperado:  this.virtualEsperado(),
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