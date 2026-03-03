import { Component, inject, input, model, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

// Modelos e Interfaces
import { Piso } from '../../../../models/maestro/piso.model';
import { PisoWizardData } from '../piso.component'; // Importamos la interfaz del padre

@Component({
  selector: 'app-modal-piso',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule
  ],
  templateUrl: './modal-piso.component.html',
  styleUrl: './modal-piso.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalPisoComponent {
  private readonly fb = inject(FormBuilder);

  // Angular 19 Signals
  readonly visible = model<boolean>(false);
  readonly dataToEdit = input<Piso | null>(null);
  readonly loading = input<boolean>(false); // Ahora viene del padre

  // Output unificado siguiendo tu patrón Wizard
  readonly onSave = output<PisoWizardData>();

  readonly pisoForm: FormGroup;

  constructor() {
    this.pisoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });

    // Reactividad para llenar el formulario
    effect(() => {
      const p = this.dataToEdit();
      if (p) {
        this.pisoForm.patchValue({
          nombre: p.nombre,
          descripcion: p.descripcion
        });
      } else {
        this.pisoForm.reset();
      }
    });
  }

  save(): void {
    if (this.pisoForm.invalid) {
      this.pisoForm.markAllAsTouched();
      return;
    }

    // Siguiendo tu patrón: enviamos el estado de edición y los datos
    this.onSave.emit({
      isEdit: !!this.dataToEdit(),
      data: this.pisoForm.value
    });
  }

  close(): void {
    this.visible.set(false);
    this.pisoForm.reset();
  }
}