import {
  Component, effect, inject, signal,
  ChangeDetectionStrategy, model, input, output, DestroyRef
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

// Modelos y Servicios
import { Cliente, CreateClienteDto } from '../../../../models/maestro/cliente.model';
import { ClienteService } from '../../../../services/maestro/cliente.service';
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-cliente',
  standalone: true,
  imports: [DialogModule, SelectModule, InputTextModule, ButtonModule, ReactiveFormsModule],
  templateUrl: './modal-cliente.component.html',
  styleUrl: './modal-cliente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalClienteComponent {
  // Inyecciones
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly consultaService = inject(ConsultaService);
  private readonly destroyRef = inject(DestroyRef);

  // Constantes
  private readonly ID_DNI = 'DNI';
  private readonly ID_RUC = 'RUC';

  // Inputs / Outputs (API moderna Angular 19)
  readonly visible = model(false);
  readonly dataToEdit = input<Cliente | null>(null);
  readonly empresaId = input<string>('');
  readonly onSave = output<void>();

  // Estado reactivo
  readonly loading = signal(false);
  readonly searching = signal(false);

  readonly tiposDoc = [
    { label: 'DNI', value: this.ID_DNI },
    { label: 'RUC', value: this.ID_RUC }
  ];

  readonly clienteForm: FormGroup = this.fb.group({
    tipoDocumentoId: [this.ID_DNI, Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    nombreRazonSocial: ['', Validators.required],
    direccion: [''],
    correo: ['', Validators.email],
    telefono: ['']
  });

  constructor() {
    // Validación dinámica por tipo de documento
    this.clienteForm.get('tipoDocumentoId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tipo => {
        const control = this.clienteForm.get('numeroDocumento');
        if (tipo === this.ID_DNI) {
          control?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern('^[0-9]*$')]);
        } else if (tipo === this.ID_RUC) {
          control?.setValidators([Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern('^[0-9]*$')]);
        }
        control?.updateValueAndValidity();
      });

    // Reaccionar a la apertura/cierre del modal
    effect(() => {
      if (this.visible()) {
        const data = this.dataToEdit();
        if (data) {
          this.clienteForm.patchValue(data);
          this.clienteForm.get('numeroDocumento')?.disable();
        } else {
          this.clienteForm.reset({ tipoDocumentoId: this.ID_DNI });
          this.clienteForm.get('numeroDocumento')?.enable();
        }
        this.clienteForm.markAsPristine();
        this.clienteForm.markAsUntouched();
      }
    });
  }

  // --- BÚSQUEDA AUTOMÁTICA ---

  buscarDocumento() {
    const doc = this.clienteForm.get('numeroDocumento')?.value;
    const tipo = this.clienteForm.get('tipoDocumentoId')?.value;
    if (!doc || doc.length < 8) return;

    this.searching.set(true);

    this.clienteService.getClienteByDocument(doc).subscribe({
      next: (clienteLocal: any) => {
        if (clienteLocal && clienteLocal.isActive === true) {
          Swal.fire({
            title: 'Cliente ya registrado',
            text: 'Este cliente ya se encuentra activo en el sistema.',
            icon: 'info',
            confirmButtonColor: '#18181b'
          });
          this.clienteForm.patchValue(clienteLocal);
          this.searching.set(false);
        } else if (clienteLocal && clienteLocal.isActive === false) {
          this.clienteForm.patchValue(clienteLocal);
          this.searching.set(false);
        } else {
          this.consultarApiExterna(tipo, doc);
        }
      },
      error: () => this.consultarApiExterna(tipo, doc)
    });
  }

  private consultarApiExterna(tipo: string, doc: string) {
    this.searching.set(true);

    if (tipo === this.ID_DNI) {
      this.consultaService.consultaDni(doc).subscribe({
        next: (res: any) => {
          const nombre = res.full_name || `${res.nombres} ${res.apellidoPaterno} ${res.apellidoMaterno}`;
          this.clienteForm.patchValue({ nombreRazonSocial: nombre.trim() });
          this.searching.set(false);
        },
        error: () => this.handleApiError()
      });
    } else if (tipo === this.ID_RUC) {
      this.consultaService.consultaRuc(doc).subscribe({
        next: (res: any) => {
          this.clienteForm.patchValue({ nombreRazonSocial: res.razon_social || res.nombre || '' });
          this.searching.set(false);
        },
        error: () => this.handleApiError()
      });
    }
  }

  private handleApiError() {
    this.searching.set(false);
    Swal.fire({
      title: 'Sin resultados en API',
      text: 'No se encontró el documento en la API externa. Puedes ingresar los datos manualmente.',
      icon: 'info',
      confirmButtonColor: '#18181b'
    });
  }

  // --- GUARDAR ---

  save() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formVal = this.clienteForm.getRawValue();

    const data = this.dataToEdit();
    if (data) {
      this.clienteService.updateCliente(formVal, data.id).subscribe({
        next: () => this.handleSuccess('actualizado'),
        error: (err) => this.handleCustomError(err)
      });
    } else {
      const dto: CreateClienteDto = { ...formVal, empresaId: this.empresaId() };
      this.clienteService.createCliente(dto as any).subscribe({
        next: () => this.handleSuccess('registrado'),
        error: (err) => this.handleCustomError(err)
      });
    }
  }

  private handleSuccess(msg: string) {
    this.loading.set(false);
    Swal.fire('¡Éxito!', `Cliente ${msg} correctamente.`, 'success');
    this.onSave.emit();
    this.close();
  }

  private handleCustomError(err: any) {
    this.loading.set(false);
    const msg = err.error?.message || 'Ocurrió un problema con el servidor.';
    Swal.fire('Atención', msg, 'error');
  }

  close() {
    this.visible.set(false);
    this.loading.set(false);
  }

  // --- HELPERS DE VALIDACIÓN ---

  isInvalid(name: string): boolean {
    const control = this.clienteForm.get(name);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(name: string): string {
    const control = this.clienteForm.get(name);
    if (control?.hasError('required')) return 'Este campo es obligatorio.';
    if (control?.hasError('minlength')) {
      const req = control.getError('minlength').requiredLength;
      return `Mínimo ${req} dígitos.`;
    }
    if (control?.hasError('maxlength')) {
      const req = control.getError('maxlength').requiredLength;
      return `Máximo ${req} dígitos.`;
    }
    if (control?.hasError('pattern')) return 'Solo se permiten números.';
    if (control?.hasError('email')) return 'Formato de correo inválido.';
    return '';
  }
}
