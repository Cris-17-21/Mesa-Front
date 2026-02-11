import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { PisoService } from '../../../../services/maestro/piso.service';
import { Piso } from '../../../../models/maestro/piso.model';

@Component({
  selector: 'app-modal-piso',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    DialogModule, 
    ButtonModule, 
    InputTextModule, 
    TextareaModule
  ],
  templateUrl: './modal-piso.component.html',
  styleUrl: './modal-piso.component.css'
})
export class ModalPisoComponent implements OnChanges {

  private fb = inject(FormBuilder);
  private pisoService = inject(PisoService);

  @Input() visible = false;
  @Input() dataToEdit: Piso | null = null;
  @Input() sucursalId: string = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  pisoForm: FormGroup;
  loading = signal(false);

  constructor() {
    this.pisoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataToEdit']?.currentValue) {
      const p = changes['dataToEdit'].currentValue as Piso;
      this.pisoForm.patchValue({
        nombre: p.nombre,
        descripcion: p.descripcion
      });
    } else if (changes['visible']?.currentValue === true && !this.dataToEdit) {
      this.pisoForm.reset();
    }
  }

  save() {
    if (this.pisoForm.invalid) {
      this.pisoForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = { 
      ...this.pisoForm.value, 
      sucursalId: this.sucursalId 
    };

    const request = this.dataToEdit
      ? this.pisoService.updatePiso({ ...payload, id: this.dataToEdit.id })
      : this.pisoService.createPiso(payload);

    request.subscribe({
      next: () => {
        Swal.fire({
          title: this.dataToEdit ? '¡Actualizado!' : '¡Creado!',
          text: `El piso se ha ${this.dataToEdit ? 'actualizado' : 'creado'} con éxito.`,
          icon: 'success',
          confirmButtonColor: '#18181b',
          timer: 2000
        });
        this.onSave.emit();
        this.close();
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
        Swal.fire('Error', err.error?.message || 'No se pudo procesar la solicitud', 'error');
      },
      complete: () => this.loading.set(false)
    });
  }

  close() {
    this.visibleChange.emit(false);
    this.pisoForm.reset();
  }
}