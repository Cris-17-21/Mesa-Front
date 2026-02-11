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
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';

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
  private consultaService = inject(ConsultaService);

  @Input() visible = false;
  @Input() isReadOnly = false;
  @Input() dataToEdit: Empresa | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onComplete = new EventEmitter<any>();

  currentStep = signal(0);
  loading = signal(false);
  searchingRuc = signal(false);
  previewLogo = signal<string | null>(null);
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
      logoUrl: [''],
      fechaAfiliacion: [new Date().toISOString()]
    }),
    sucursal: this.fb.group({
      nombre: ['Sede Principal', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required]
    }),
    usuario: this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]], // Solo 8 números
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^9[0-9]{8}$')]], // Inicia con 9 y tiene 9 dígitos
      email: ['', [Validators.required, Validators.email]],
      tipoDocumento: ['DNI'] // Por defecto
    })
  });

  ngOnInit() {
    this.loadAdminRole();
    this.setupDocValidation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue === true) {
      if (this.isReadOnly) {
        this.setupViewMode();
      } else if (this.dataToEdit) {
        this.setupEditMode();
      } else {
        this.setupCreateMode();
      }
    }
  }

  private setupViewMode() {
    this.steps.set([{ label: 'Información General' }]);
    this.currentStep.set(0); // Mostraremos todo en una sola vista o permitiremos navegar
    this.wizardForm.patchValue(this.dataToEdit!); // Cargamos la data
    this.wizardForm.disable(); // Desactivamos TODO el formulario

    // Si tienes el logo, asegúrate de cargarlo en la previsualización
    if (this.dataToEdit?.logoUrl) {
      this.previewLogo.set(this.dataToEdit.logoUrl);
    }
  }

  buscarRuc(ruc: string) {
    this.searchingRuc.set(true);
    this.consultaService.consultaRuc(ruc).subscribe({
      next: (res) => {
        this.wizardForm.get('empresa')?.patchValue({
          razonSocial: res.razon_social,
          direccionFiscal: res.direccion
        });
        this.searchingRuc.set(false);
      },
      error: () => this.searchingRuc.set(false)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.previewLogo.set(reader.result as string);
      reader.readAsDataURL(file);
      // Aquí guardarías el file para subirlo luego o la base64
      this.wizardForm.get('empresa.logoUrl')?.setValue(file.name);
    }
  }

  getErrorMessage(path: string): string {
    const control = this.wizardForm.get(path);
    if (!control || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['email']) return 'Correo electrónico inválido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['pattern']) return 'Solo se permiten números';

    return 'Campo no válido';
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
    console.log('🚀 Iniciando saveAll...');
    console.log('Estado de carga actual:', this.loading());

    // 1. Verificación inicial de validez
    if (this.wizardForm.invalid) {
      console.error('❌ Formulario inválido globalmente');
      this.logValidationErrors(); // Función que crearemos abajo
      this.wizardForm.markAllAsTouched();
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const formValue = this.wizardForm.getRawValue();
    console.log('📦 Valores capturados:', formValue);

    // 2. Lógica para EDICIÓN
    if (this.dataToEdit) {
      console.log('📝 Modo Edición detectado para ID:', this.dataToEdit.id);
      this.onComplete.emit({
        data: { ...formValue.empresa, id: this.dataToEdit.id },
        isEdit: true
      });
      return;
    }

    // 3. Lógica para CREACIÓN
    console.log('✨ Modo Creación detectado');
    const finalData = {
      ...formValue,
      empresa: {
        ...formValue.empresa,
        fechaAfiliacion: new Date().toISOString()
      }
    };

    console.log('out -> 📤 Emitiendo onComplete con:', finalData);
    this.onComplete.emit({ data: finalData, isEdit: false });
  }

  // MÉTODO DE APOYO: Esto te dirá en consola exactamente qué input falla
  logValidationErrors() {
    const controls = this.wizardForm.controls;
    Object.keys(controls).forEach(key => {
      const group = controls[key] as FormGroup;
      if (group.invalid) {
        console.warn(`⚠️ Grupo [${key}] es inválido`);
        Object.keys(group.controls).forEach(field => {
          const control = group.get(field);
          if (control?.invalid) {
            console.error(`   - Campo [${field}] falló. Errores:`, control.errors);
          }
        });
      }
    });
  }

  close() {
    this.visibleChange.emit(false);
  }

  consultarRuc() {
    const ruc = this.wizardForm.get('empresa.ruc')?.value;

    if (!ruc || ruc.length !== 11) {
      return;
    }

    this.consultaService.consultaRuc(ruc).subscribe({
      next: (data) => {
        this.wizardForm.get('empresa.razonSocial')?.setValue(data.razon_social);
        this.wizardForm.get('empresa.direccionFiscal')?.setValue(data.direccion);
      },
      error: (error) => {
        console.error('Error al consultar RUC:', error);
      }
    })
  }

  consultarDni() {
    const dni = this.wizardForm.get('usuario.numeroDocumento')?.value;

    if (!dni || dni.length !== 8) {
      return;
    }

    this.consultaService.consultaDni(dni).subscribe({
      next: (data) => {
        this.wizardForm.get('usuario.nombres')?.setValue(data.first_name);
        this.wizardForm.get('usuario.apellidoPaterno')?.setValue(data.first_last_name);
        this.wizardForm.get('usuario.apellidoMaterno')?.setValue(data.second_last_name);
      },
      error: (error) => {
        console.error('Error al consultar DNI:', error);
      }
    })
  }


}