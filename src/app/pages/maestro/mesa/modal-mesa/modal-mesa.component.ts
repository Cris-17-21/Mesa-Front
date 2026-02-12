import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import Swal from 'sweetalert2';
import { CreateMesaDto, Mesa, UpdateMesaDto } from '../../../../models/maestro/mesa.model';
import { MesaService } from '../../../../services/maestro/mesa.service';
import { PisoService } from '../../../../services/maestro/piso.service';
import { Piso } from '../../../../models/maestro/piso.model';

@Component({
  selector: 'app-modal-mesa',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DialogModule,
    ButtonModule, InputTextModule, InputNumberModule, DropdownModule
  ],
  templateUrl: './modal-mesa.component.html',
  styleUrls: ['./modal-mesa.component.css']
})
export class ModalMesaComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() dataToEdit: Mesa | null = null;
  @Input() sucursalId: string = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private mesaService = inject(MesaService);
  private pisoService = inject(PisoService);

  mesaForm: FormGroup;
  loading = signal(false);
  pisos = signal<Piso[]>([]);

  constructor() {
    this.mesaForm = this.fb.group({
      codigoMesa: ['', [Validators.required, Validators.maxLength(10)]],
      capacidad: [2, [Validators.required, Validators.min(1)]],
      pisoId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPisos();
  }

  // Se ejecuta cada vez que el modal se abre/cambia dataToEdit
  ngOnChanges(): void {
    if (this.dataToEdit) {
      const estadoMesa = this.dataToEdit.estado?.toUpperCase();

      // 1. Quitamos validaciones de pisoId para la EDICIÓN
      this.mesaForm.get('pisoId')?.clearValidators();
      this.mesaForm.get('pisoId')?.updateValueAndValidity();

      // 2. Evaluamos si se permite editar según el estado
      if (estadoMesa !== 'DISPONIBLE' && estadoMesa !== 'LIBRE') {
        this.mesaForm.disable();
      } else {
        this.mesaForm.enable();
      }

      // 3. Cargamos los datos
      this.mesaForm.patchValue({
        codigoMesa: this.dataToEdit.codigoMesa,
        capacidad: this.dataToEdit.capacidad
      });

    } else {
      // 4. Si es CREACIÓN, nos aseguramos de que el pisoId sea obligatorio de nuevo
      this.mesaForm.enable();
      this.mesaForm.reset({ capacidad: 2 });
      this.mesaForm.get('pisoId')?.setValidators([Validators.required]);
      this.mesaForm.get('pisoId')?.updateValueAndValidity();
    }
  }

  loadPisos() {
    if (!this.sucursalId) return;
    this.pisoService.getPisosBySucursal(this.sucursalId).subscribe(data => this.pisos.set(data));
  }

  save() {
    if (this.mesaForm.invalid) {
      // Esto hace que todos los mensajes de error aparezcan de golpe
      console.log('Formulario inválido. Campos con error:', this.mesaForm.controls);
      this.mesaForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formVal = this.mesaForm.value;

    if (this.dataToEdit) {
      const updateDto: UpdateMesaDto = {
        codigoMesa: formVal.codigoMesa,
        capacidad: formVal.capacidad
      };
      console.log("hola")
      this.mesaService.updateMesa(updateDto, this.dataToEdit.id).subscribe({
        next: () => this.handleSuccess('actualizada'),
        error: () => this.handleError()
      });
    } else {
      const createDto: CreateMesaDto = {
        codigoMesa: formVal.codigoMesa,
        capacidad: formVal.capacidad,
        pisoId: formVal.pisoId
      };
      this.mesaService.createMesa(createDto).subscribe({
        next: () => this.handleSuccess('creada'),
        error: (err) => {
          console.log(err)
          this.handleError()
        }
      });
    }
  }

  private handleSuccess(accion: string) {
    Swal.fire({
      title: '¡Éxito!',
      text: `La mesa ha sido ${accion} correctamente.`,
      icon: 'success',
      confirmButtonColor: '#18181b'
    });
    this.onSave.emit();
    this.close();
  }

  private handleError() {
    this.loading.set(false);
    Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
  }

  close() {
    this.visibleChange.emit(false);
    this.mesaForm.reset();
  }
}