import { Component, inject, input, model, output, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputSwitchModule } from 'primeng/inputswitch';

import { CreateMetodoPagoDto, MetodoPago } from '../../../../models/maestro/metodo-pago.model';
import { MetodoPagoWizardData } from '../metodo-pago.component';

@Component({
  selector: 'app-modal-metodo-pago',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectButtonModule,
    InputSwitchModule
  ],
  templateUrl: './modal-metodo-pago.component.html',
  styleUrl: './modal-metodo-pago.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalMetodoPagoComponent {
  private readonly fb = inject(FormBuilder);

  readonly visible = model<boolean>(false);
  readonly dataToEdit = input<MetodoPago | null>(null);
  readonly loading = input<boolean>(false);
  readonly empresaId = input<string>('');

  readonly onSave = output<MetodoPagoWizardData>();

  readonly metodoPagoForm: FormGroup;

  constructor() {
    this.metodoPagoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]]
    });

    effect(() => {
      const mp = this.dataToEdit();
      if (mp) {
        this.metodoPagoForm.patchValue({
          nombre: mp.nombre,
        });
      } else {
        this.metodoPagoForm.reset({
          nombre: '',
        });
      }
    });
  }

  save(): void {
    if (this.metodoPagoForm.invalid) {
      this.metodoPagoForm.markAllAsTouched();
      return;
    }
    const formValue = this.metodoPagoForm.getRawValue();
    const dto: CreateMetodoPagoDto = { ...formValue, empresaId: this.empresaId() };
    this.onSave.emit({
      isEdit: !!this.dataToEdit(),
      data: dto
    });
  }

  close(): void {
    this.visible.set(false);
    this.metodoPagoForm.reset();
  }

  // --- HELPERS DE VALIDACIÓN ---

  isInvalid(name: string): boolean {
    const control = this.metodoPagoForm.get(name);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(name: string): string {
    const control = this.metodoPagoForm.get(name);
    if (control?.hasError('required')) return 'Este campo es obligatorio.';
    if (control?.hasError('minlength')) {
      const req = control.getError('minlength').requiredLength;
      return `Mínimo ${req} caracteres.`;
    }
    return '';
  }
}
