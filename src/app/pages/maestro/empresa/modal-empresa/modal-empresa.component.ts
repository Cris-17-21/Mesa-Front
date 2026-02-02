import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MenuItem } from 'primeng/api';

// Modelos y Servicios
import { Empresa } from '../../../../models/maestro/empresa.model';
import { Role } from '../../../../models/security/role.model';
import { RoleService } from '../../../../services/config/role.service';

@Component({
  selector: 'app-modal-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    StepsModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './modal-empresa.component.html',
  styleUrl: './modal-empresa.component.css'
})

export class ModalEmpresaComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);

  @Input() visible = false;
  @Input() dataToEdit: Empresa | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onComplete = new EventEmitter<any>();

  currentStep = signal(0);
  loading = signal(false);
  adminRoleId = signal<string | null>(null);

  steps = signal<MenuItem[]>([
    { label: 'Empresa' },
    { label: 'Sucursal' },
    { label: 'Admin' }
  ]);

  tiposDoc = [
    { label: 'DNI', value: 'DNI' },
    { label: 'RUC', value: 'RUC' }
  ];

  wizardForm: FormGroup = this.fb.group({
    empresa: this.fb.group({
      ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern('^[0-9]*$')]],
      razonSocial: ['', Validators.required],
      direccionFiscal: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      logoUrl: ['']
    }),
    sucursal: this.fb.group({
      nombre: ['Sede Principal', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required]
    }),
    usuario: this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern('^[0-9]*$')]],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roleId: ['', Validators.required]
    })
  });

  ngOnInit() {
    this.loadAdminRole();
    this.setupDocValidation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue === true) {
      if (this.dataToEdit) {
        this.setupEditMode();
      } else {
        this.setupCreateMode();
      }
    }
  }

  private loadAdminRole() {
    this.roleService.getAllRoles().subscribe(roles => {
      // Ajusta 'ADMIN' por el nombre exacto que tengas en tu BD
      const role = roles.find(r => r.name === 'ADMIN' || r.name === 'ADMIN_RESTAURANTE');
      if (role) {
        this.adminRoleId.set(role.id);
        this.wizardForm.get('usuario.roleId')?.setValue(role.id);
      }
    });
  }

  private setupDocValidation() {
    this.wizardForm.get('usuario.tipoDocumento')?.valueChanges.subscribe(tipo => {
      const docControl = this.wizardForm.get('usuario.numeroDocumento');
      if (tipo === 'DNI') {
        docControl?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern('^[0-9]*$')]);
      } else {
        docControl?.setValidators([Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern('^[0-9]*$')]);
      }
      docControl?.updateValueAndValidity();
    });
  }

  private setupEditMode() {
    this.steps.set([{ label: 'Editar Empresa' }]);
    this.currentStep.set(0);
    this.wizardForm.get('empresa')?.patchValue(this.dataToEdit!);
    this.wizardForm.get('sucursal')?.disable();
    this.wizardForm.get('usuario')?.disable();
  }

  private setupCreateMode() {
    this.steps.set([{ label: 'Empresa' }, { label: 'Sucursal' }, { label: 'Admin' }]);
    this.currentStep.set(0);
    this.wizardForm.enable();
    this.wizardForm.reset({
      empresa: { logoUrl: '' },
      usuario: { tipoDocumento: 'DNI', roleId: this.adminRoleId() },
      sucursal: { nombre: 'Sede Principal' }
    });
  }

  isFieldInvalid(path: string): boolean {
    const control = this.wizardForm.get(path);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  nextStep() {
    const groups = ['empresa', 'sucursal', 'usuario'];
    const currentGroup = this.wizardForm.get(groups[this.currentStep()]);

    if (currentGroup?.invalid) {
      currentGroup.markAllAsTouched();
      return;
    }
    this.currentStep.update(v => v + 1);
  }

  prevStep() {
    this.currentStep.update(v => v - 1);
  }

  saveAll() {
    this.loading.set(true);

    // Extraemos los valores ignorando el estado de 'disabled'
    const formValue = this.wizardForm.getRawValue();

    // Caso: EDICIÓN
    if (this.dataToEdit) {
      // Si editamos, solo nos importa el grupo 'empresa'
      if (this.wizardForm.get('empresa')?.valid) {
        this.onComplete.emit({
          data: { ...formValue.empresa, id: this.dataToEdit.id },
          isEdit: true
        });
      } else {
        this.wizardForm.get('empresa')?.markAllAsTouched();
        this.loading.set(false);
      }
      return;
    }

    // Caso: CREACIÓN (Validación manual por grupos)
    const isEmpresaValid = this.wizardForm.get('empresa')?.valid;
    const isSucursalValid = this.wizardForm.get('sucursal')?.valid;
    const isUsuarioValid = this.wizardForm.get('usuario')?.valid;

    if (isEmpresaValid && isSucursalValid && isUsuarioValid) {
      this.onComplete.emit({
        data: {
          empresa: formValue.empresa,
          sucursal: formValue.sucursal,
          usuario: formValue.usuario
        },
        isEdit: false
      });
    } else {
      this.loading.set(false);
      this.wizardForm.markAllAsTouched();
      console.error('Formulario incompleto:', {
        empresa: this.wizardForm.get('empresa')?.errors,
        sucursal: this.wizardForm.get('sucursal')?.errors,
        usuario: this.wizardForm.get('usuario')?.errors
      });
      // Opcional: Alerta visual rápida para saber qué paso revisar
      if (!isEmpresaValid) this.currentStep.set(0);
      else if (!isSucursalValid) this.currentStep.set(1);
      else if (!isUsuarioValid) this.currentStep.set(2);
    }
  }

  close() {
    this.visibleChange.emit(false);
  }
}