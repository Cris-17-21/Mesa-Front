import { Component, effect, inject, ChangeDetectionStrategy, model, input, output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';

// Modelos y Servicios
import { Sucursal } from '../../../../models/maestro/sucursal.model';

export interface SeriesModalData {
  sucursalId: string;
  tipoDoc: string;
  serie: string;
  correlativo: number;
}

@Component({
  selector: 'app-modal-series',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DialogModule,
    ButtonModule, InputTextModule, SelectModule, InputNumberModule
  ],
  templateUrl: './modal-series.component.html',
  styleUrl: './modal-series.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalSeriesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly visible = model(false);
  readonly sucursalesList = input<Sucursal[]>([]);
  readonly defaultSucursalId = input<string | null>(null);
  readonly loading = input(false);
  readonly onComplete = output<SeriesModalData>();

  readonly seriesForm: FormGroup = this.fb.group({
    sucursalId: [null, Validators.required],
    tipoDoc: [null, Validators.required],
    serie: ['', [Validators.required, Validators.pattern('^[FBC][A-Z0-9]{3}$')]],
    correlativo: [1, [Validators.required, Validators.min(1)]]
  });

  readonly tipoDocumentoOptions = [
    { label: 'Factura Electrónica', value: '01' },
    { label: 'Boleta de Venta Electrónica', value: '03' },
    { label: 'Nota de Crédito', value: '07' },
    { label: 'Nota de Débito', value: '08' }
  ];

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const defaultId = this.defaultSucursalId();

      if (isVisible) {
        this.seriesForm.reset({
          sucursalId: defaultId,
          tipoDoc: '01',
          serie: '',
          correlativo: 1
        });
        this.seriesForm.markAsPristine();
        this.seriesForm.markAsUntouched();
        this.cdr.markForCheck();
      } else {
        this.seriesForm.reset();
      }
    });
  }

  save() {
    if (this.loading()) return;

    if (this.seriesForm.invalid) {
      this.seriesForm.markAllAsTouched();
      return;
    }

    const rawValue = this.seriesForm.getRawValue();
    this.onComplete.emit({
      sucursalId: rawValue.sucursalId,
      tipoDoc: rawValue.tipoDoc,
      serie: rawValue.serie.toUpperCase(),
      correlativo: rawValue.correlativo
    });
  }

  close() {
    this.visible.set(false);
  }

  isInvalid(name: string): boolean {
    const control = this.seriesForm.get(name);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(name: string): string {
    const control = this.seriesForm.get(name);
    if (control?.hasError('required')) return 'Obligatorio';
    if (control?.hasError('pattern')) return 'Debe ser de 4 caracteres y empezar con F, B o C (ej: F001, B001, C001)';
    if (control?.hasError('min')) return 'Mínimo 1';
    return '';
  }
}
