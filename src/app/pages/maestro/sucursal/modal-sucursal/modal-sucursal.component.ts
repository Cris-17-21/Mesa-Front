import { Component, effect, inject, ChangeDetectionStrategy, model, input, output, DestroyRef, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

// Modelos y Servicios
import { CreateSucursalDto, Sucursal } from '../../../../models/maestro/sucursal.model';
import { Empresa } from '../../../../models/maestro/empresa.model';
import Swal from 'sweetalert2';

export interface SucursalModalData {
  isEdit: boolean;
  data: CreateSucursalDto;
}


@Component({
  selector: 'app-modal-sucursal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './modal-sucursal.component.html',
  styleUrl: './modal-sucursal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalSucursalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly visible = model(false);
  readonly dataToEdit = input<Sucursal | null>(null);
  readonly empresasList = input<Empresa[]>([]); // Recibidas del padre
  readonly defaultEmpresaId = input<string | null>(null); // Filtro activo en el padre
  readonly loading = input(false);
  readonly onComplete = output<SucursalModalData>();

  readonly sucursalForm: FormGroup = this.fb.group({
    empresa: [null, Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    direccion: [''],
    telefono: ['', [Validators.pattern('^[0-9]*$')]],
  });

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const lista = this.empresasList();
      const data = this.dataToEdit();
      const defaultId = this.defaultEmpresaId();

      if (isVisible && lista.length > 0) {
        if (data) {
          this.patchForm(data);
        } else {
          this.setupCreateMode(defaultId);
        }
        this.cdr.markForCheck();
      } else if (!isVisible) {
        this.sucursalForm.reset();
      }
    });
  }



  private patchForm(data: Sucursal) {
    // El padre ya nos pasa empresa como el ID (string) al llamar openEdit()
    const empresaId = typeof data.empresa === 'string' ? data.empresa : (data.empresa as any)?.id ?? null;

    this.sucursalForm.patchValue({
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono,
      empresa: empresaId
    }, { emitEvent: false });

    this.cdr.markForCheck();
  }

  private setupCreateMode(defaultId: string | null) {
    this.sucursalForm.reset({
      empresa: defaultId, // Auto-selecciona si hay un filtro activo o llega del padre
      nombre: '',
      direccion: '',
      telefono: ''
    });
    this.sucursalForm.markAsPristine();
    this.sucursalForm.markAsUntouched();
    this.cdr.markForCheck();
  }

  save() {
    if (this.loading()) return;

    if (this.sucursalForm.invalid) {
      this.sucursalForm.markAllAsTouched();
      return;
    }

    const rawValue = this.sucursalForm.getRawValue();
    const payload = {
      nombre: rawValue.nombre?.toUpperCase(),
      direccion: rawValue.direccion?.toUpperCase(),
      telefono: rawValue.telefono,
      empresaId: rawValue.empresa // Es el ID directo gracias al optionValue="id"
    };

    this.onComplete.emit({
      data: payload as CreateSucursalDto,
      isEdit: !!this.dataToEdit()
    });
  }

  close() {
    this.visible.set(false);
    // El reset ocurre automáticamente vía effect cuando visible cambia a false
  }

  isInvalid(name: string): boolean {
    const control = this.sucursalForm.get(name);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(name: string): string {
    const control = this.sucursalForm.get(name);
    if (control?.hasError('required')) return 'Obligatorio';
    if (control?.hasError('minlength')) return 'Mínimo 3 caracteres';
    if (control?.hasError('pattern')) return 'Solo números';
    return '';
  }

  private showError(msg: string) {
    Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonColor: '#18181b' });
  }
}