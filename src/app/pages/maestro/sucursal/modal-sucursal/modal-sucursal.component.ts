import { Component, EventEmitter, inject, Input, Output, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SucursalService } from '../../../../services/maestro/sucursal.service';
import { EmpresaService } from '../../../../services/maestro/empresa.service';
import { Empresa } from '../../../../models/maestro/empresa.model';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-modal-sucursal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './modal-sucursal.component.html',
  styleUrl: './modal-sucursal.component.css'
})
export class ModalSucursalComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private sucursalService = inject(SucursalService);
  private empresaService = inject(EmpresaService);

  @Input() visible = false;
  @Input() dataToEdit: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSaveSuccess = new EventEmitter<void>();

  loading = signal(false);
  empresas = signal<Empresa[]>([]);

  sucursalForm: FormGroup = this.fb.group({
    empresa: [null, Validators.required], // Guardaremos el objeto empresa completo o el ID según prefieras
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    direccion: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
  });

  ngOnInit() {
    this.cargarEmpresas();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue) {
      if (this.dataToEdit) {
        // Mapeamos los datos existentes al formulario
        this.sucursalForm.patchValue({
          nombre: this.dataToEdit.nombre,
          direccion: this.dataToEdit.direccion,
          telefono: this.dataToEdit.telefono,
          empresa: this.dataToEdit.empresa // Pasamos el objeto empresa completo para el p-select
        });
      } else {
        this.sucursalForm.reset();
      }
    }
  }

  private cargarEmpresas() {
    this.empresaService.getAllEmpresas().subscribe({
      next: (data) => this.empresas.set(data),
      error: (err) => console.error('Error en EmpresaService:', err)
    });
  }

  // Helpers para validación visual
  isInvalid(name: string) {
    const control = this.sucursalForm.get(name);
    return control?.invalid && (control?.dirty || control?.touched);
  }

  getErrorMessage(name: string): string {
    const control = this.sucursalForm.get(name);
    if (control?.hasError('required')) return 'Este campo es obligatorio';
    if (control?.hasError('minlength')) return 'Mínimo 3 caracteres';
    if (control?.hasError('pattern')) return 'Número de teléfono inválido';
    return '';
  }

  save() {
    if (this.sucursalForm.invalid) {
      this.sucursalForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const rawValue = this.sucursalForm.value;

    // AJUSTE AQUÍ: Aplanamos el objeto para que coincida con lo que el backend espera
    const payload = {
      nombre: rawValue.nombre,
      direccion: rawValue.direccion,
      telefono: rawValue.telefono,
      // Extraemos solo el ID del objeto empresa que seleccionó el p-select
      empresaId: rawValue.empresa?.id || rawValue.empresa
    };

    console.log('📤 Enviando payload corregido:', payload);

    const request = this.dataToEdit
      ? this.sucursalService.updateSucursal(payload, this.dataToEdit.id)
      : this.sucursalService.createSucursal(payload);

    request.pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          // --- AQUÍ EL SWEET ALERT ---
          Swal.fire({
            title: this.dataToEdit ? '¡Actualizado!' : '¡Registrado!',
            text: `La sucursal se ha ${this.dataToEdit ? 'actualizado' : 'creado'} correctamente.`,
            icon: 'success',
            confirmButtonColor: '#18181b', // Color Noir
            timer: 2000,
            showConfirmButton: false
          });

          this.onSaveSuccess.emit();
          this.close();
        },
        error: (err) => {
          console.error('❌ Error:', err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo procesar la solicitud. Intenta de nuevo.',
            icon: 'error',
            confirmButtonColor: '#18181b'
          });
        }
      });
  }

  close() {
    this.visibleChange.emit(false);
  }
}