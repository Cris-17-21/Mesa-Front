import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente, CreateClienteDto } from '../../../../models/maestro/cliente.model';
import { ClienteService } from '../../../../services/maestro/cliente.service';
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';

@Component({
  selector: 'app-modal-cliente',
  imports: [DialogModule, DropdownModule, InputTextModule, ButtonModule, CommonModule, ReactiveFormsModule],
  templateUrl: './modal-cliente.component.html',
  styleUrl: './modal-cliente.component.css'
})
export class ModalClienteComponent {
  @Input() visible: boolean = false;
  @Input() dataToEdit: Cliente | null = null;
  @Input() empresaId: string = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private consultaService = inject(ConsultaService);

  private readonly ID_DNI = '443d1c2c-f567-407e-95e1-310992f9fad1';
  private readonly ID_RUC = 'c8ea06f4-07d1-11f1-b338-86e7600e03aa';

  clienteForm: FormGroup;
  loading = signal(false);
  searching = signal(false);

  tiposDoc = [
    { label: 'DNI', value: this.ID_DNI, length: 8 },
    { label: 'RUC', value: this.ID_RUC, length: 11 }
  ];

  constructor() {
    this.clienteForm = this.fb.group({
      tipoDocumentoId: [this.ID_DNI, Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      nombreRazonSocial: ['', Validators.required],
      direccion: [''], // Opcional
      correo: ['', Validators.email], // Opcional pero validado si se escribe
      telefono: [''] // Opcional
    });

    // VALIDACIÓN DINÁMICA CORREGIDA
    this.clienteForm.get('tipoDocumentoId')?.valueChanges.subscribe(tipo => {
      const control = this.clienteForm.get('numeroDocumento');
      if (tipo === this.ID_DNI) {
        control?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(8)]);
      } else if (tipo === this.ID_RUC) {
        control?.setValidators([Validators.required, Validators.minLength(11), Validators.maxLength(11)]);
      }
      control?.updateValueAndValidity();
    });
  }

  ngOnChanges(): void {
    if (this.dataToEdit) {
      this.clienteForm.patchValue(this.dataToEdit);
      this.clienteForm.get('numeroDocumento')?.disable();
    } else {
      // RESET CORREGIDO: Usamos el ID de DNI en lugar de '1'
      this.clienteForm.reset({ tipoDocumentoId: this.ID_DNI });
      this.clienteForm.get('numeroDocumento')?.enable();
    }
  }

  // Lógica de búsqueda automática
  buscarDocumento() {
    const doc = this.clienteForm.get('numeroDocumento')?.value;
    const tipo = this.clienteForm.get('tipoDocumentoId')?.value;

    if (!doc || doc.length < 8) return;

    this.searching.set(true);

    this.clienteService.getClienteByDocument(doc).subscribe({
      next: (clienteLocal: any) => {
        // CASO A: Existe y está ACTIVO (Mostramos aviso porque ya está en la tabla)
        if (clienteLocal && clienteLocal.isActive === true) {
          Swal.fire({
            title: 'Cliente ya registrado',
            text: 'Este cliente ya se encuentra activo en el sistema.',
            icon: 'info',
            confirmButtonColor: '#18181b'
          });
          this.clienteForm.patchValue(clienteLocal);
          this.searching.set(false);
        }
        // CASO B: Existe pero está INACTIVO (Silencioso, solo llenamos los datos)
        else if (clienteLocal && clienteLocal.isActive === false) {
          this.clienteForm.patchValue(clienteLocal);
          this.searching.set(false);
          // Aquí no lanzamos Swal para que no parezca un error
        }
        else {
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
          // Basado en tu log: nombres + apellidos o full_name
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
      title: 'Cliente encontrado',
      text: 'Este registro ya existe. Puedes actualizar sus datos y confirmar.',
      icon: 'info',
      confirmButtonColor: '#18181b',
      target: document.getElementById('modal-container') || 'body' // <--- Esto lo trae al frente
    });
  }

  save() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formVal = this.clienteForm.getRawValue();

    if (this.dataToEdit) {
      this.clienteService.updateCliente(formVal, this.dataToEdit.id).subscribe({
        next: () => this.handleSuccess('actualizado'),
        error: (err) => this.handleCustomError(err)
      });
    } else {
      // Si el cliente ya existía (is_active: false), el Service de Java 
      // lo encontrará por numeroDocumento y hará el update + active: true
      const dto: CreateClienteDto = { ...formVal, empresaId: this.empresaId };
      this.clienteService.createCliente(dto as any).subscribe({
        next: () => this.handleSuccess('registrado'),
        error: (err) => this.handleCustomError(err)
      });
    }
  }

  private handleSuccess(msg: string) {
    Swal.fire('¡Éxito!', `Cliente ${msg} correctamente.`, 'success');
    this.onSave.emit();
    this.close();
  }

  private handleCustomError(err: any) {
    this.loading.set(false);
    // Mostramos el mensaje exacto del backend (ej: "Ya está registrado y activo")
    const msg = err.error?.message || 'Ocurrió un problema con el servidor.';
    Swal.fire('Atención', msg, 'error');
  }

  close() {
    this.visibleChange.emit(false);
    this.loading.set(false);
  }
}
