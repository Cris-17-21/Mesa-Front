import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

// Servicios y Modelos
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
export class CajaControlModalComponent implements OnInit, OnChanges {

  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);

  // --- Inputs ---
  @Input() visible = false;
  @Input() type: 'OPEN' | 'CLOSE' = 'OPEN';
  @Input() cajaActivaId: string | undefined | null; // Acepta null también
  @Input() saldoEsperado: number = 0;
  @Input() sucursalId: string | null = null;
  @Input() usuarioId: string | null = null;

  // --- Outputs ---
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  form: FormGroup;
  loading = signal(false);
  diferencia = signal(0);

  constructor() {
    this.form = this.fb.group({
      monto: [0, [Validators.required, Validators.min(0)]],
      observacion: ['']
    });
  }

  ngOnInit() {
    // Calcular diferencia en tiempo real (Solo visual para el cierre)
    this.form.get('monto')?.valueChanges.subscribe(valorIngresado => {
      if (this.type === 'CLOSE') {
        const real = valorIngresado || 0;
        this.diferencia.set(real - this.saldoEsperado);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue) {
      this.resetForm();
    }
  }

  resetForm() {
    this.form.reset({ monto: 0, observacion: '' });
    this.diferencia.set(0 - (this.type === 'CLOSE' ? this.saldoEsperado : 0));
    this.loading.set(false);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    if (this.type === 'OPEN') {
      this.handleApertura(formValue);
    } else {
      this.handleCierre(formValue);
    }
  }

  // --- LÓGICA DE APERTURA ---
  private handleApertura(data: any) {
    if (!this.sucursalId || !this.usuarioId) {
      this.showError('Faltan datos de sesión (Sucursal o Usuario)');
      return;
    }

    const payload: AbrirCajaDto = {
      sucursalId: this.sucursalId,
      usuarioId: this.usuarioId,
      montoApertura: data.monto
      // Nota: Tu DTO AbrirCajaDto no tiene observación/comentario
    };

    this.cajaService.abrirCaja(payload).subscribe({
      next: () => this.showSuccess('Turno abierto correctamente'),
      error: (err) => this.showError(err)
    });
  }

  // --- LÓGICA DE CIERRE ---
  private handleCierre(data: any) {
    if (!this.cajaActivaId) {
      this.showError('No hay una caja activa seleccionada para cerrar');
      return;
    }

    const payload: CerrarCajaDto = {
      id: this.cajaActivaId,
      efectivoReal: data.monto,
      tarjetaReal: 0, // Por ahora 0, luego puedes agregar un input para tarjetas si lo necesitas
      comentario: data.observacion || ''
    };

    this.cajaService.cerrarCaja(payload).subscribe({
      next: () => this.showSuccess('Turno cerrado correctamente'),
      error: (err) => this.showError(err)
    });
  }

  // --- HELPERS VISUALES ---

  private showSuccess(msg: string) {
    this.loading.set(false);
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: msg,
      confirmButtonColor: '#18181b',
      timer: 1500
    });
    this.onSave.emit(); // Notificar al padre
    this.close();
  }

  private showError(err: any) {
    this.loading.set(false);
    console.error('Error en operación de caja:', err);

    // Extraer mensaje de error del backend si existe
    const errorMsg = typeof err === 'string' ? err : (err.error?.message || 'Ocurrió un error inesperado');

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errorMsg,
      confirmButtonColor: '#18181b'
    });
  }

  close() {
    this.visibleChange.emit(false);
  }
}