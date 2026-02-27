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
  @Input() loading = false;

  // Signals para estado reactivo
  currentStep = signal(0);
  previewLogo = signal<string | null>(null);
  adminRoleId = signal<string | null>(null);
  searchingRuc = signal(false);
  searchingDni = signal(false);

  steps = signal<MenuItem[]>([
    { label: 'Empresa' },
    { label: 'Sucursal' },
    { label: 'Administrador' }
  ]);

  tiposDoc = [
    { label: 'DNI', value: 'DNI' },
    { label: 'RUC', value: 'RUC' }
  ];

  wizardForm: FormGroup = this.fb.group({
    empresa: this.fb.group({
      ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern('^[0-9]*$')]],
      razonSocial: ['', Validators.required],
      direccionFiscal: [''],
      telefono: ['', [Validators.minLength(9), Validators.maxLength(9), Validators.pattern('^[0-9]*$')]],
      email: ['', [Validators.email]],
      logoUrl: [''],
      fechaAfiliacion: [new Date().toISOString().split('T')[0]]
    }),
    sucursal: this.fb.group({
      nombre: ['Sede Principal', Validators.required],
      direccion: [''],
      telefono: ['', [Validators.minLength(9), Validators.maxLength(9), Validators.pattern('^[0-9]*$')]]
    }),
    user: this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required],
      tipoDocumento: [{ value: 'DNI', disabled: true }],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8}$'), Validators.maxLength(8), Validators.minLength(8)]],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      telefono: ['', [Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.email]]
    })
  });

  ngOnInit() {
    this.loadAdminRole();
    this.setupDocValidation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue === true) {
      this.resetWizard();
      if (this.isReadOnly) this.setupViewMode();
      else if (this.dataToEdit) this.setupEditMode();
      else this.setupCreateMode();
    }
  }

  // --- LÓGICA DE NAVEGACIÓN Y UX ---

  nextStep() {
    const groups = ['empresa', 'sucursal', 'user'];
    const currentGroupName = groups[this.currentStep()];
    const currentGroup = this.wizardForm.get(currentGroupName) as FormGroup;

    if (currentGroup.invalid) {
      currentGroup.markAllAsTouched();
      this.scrollToFirstInvalidControl(currentGroupName);
      return;
    }

    this.currentStep.update(v => v + 1);
  }

  prevStep() {
    this.currentStep.update(v => v - 1);
  }

  private scrollToFirstInvalidControl(groupName: string) {
    setTimeout(() => {
      const firstInvalidControl = document.querySelector(
        `[formGroupName="${groupName}"] .ng-invalid`
      );
      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstInvalidControl as HTMLElement).focus?.();
      }
    }, 100);
  }

  // --- MÉTODOS DE CONSULTA (API EXTERNA) ---

  consultarRuc() {
    const ruc = this.wizardForm.get('empresa.ruc')?.value;
    if (!ruc || ruc.length !== 11) return;

    this.searchingRuc.set(true);
    this.consultaService.consultaRuc(ruc).subscribe({
      next: (data) => {
        this.wizardForm.get('empresa')?.patchValue({
          razonSocial: data.razon_social,
          direccionFiscal: data.direccion
        });
        this.searchingRuc.set(false);
      },
      error: () => this.searchingRuc.set(false)
    });
  }

  consultarDni() {
    const dni = this.wizardForm.get('user.numeroDocumento')?.value;
    if (dni?.length !== 8) return;

    this.searchingDni.set(true);
    this.consultaService.consultaDni(dni).subscribe({
      next: (data) => {
        this.wizardForm.get('user')?.patchValue({
          nombres: data.first_name,
          apellidoPaterno: data.first_last_name,
          apellidoMaterno: data.second_last_name
        });
        this.searchingDni.set(false);
      },
      error: () => this.searchingDni.set(false)
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // 1. Validamos el tipo de archivo por seguridad (QA Checklist)
      if (!file.type.startsWith('image/')) {
        console.error('El archivo seleccionado no es una imagen');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        // 2. Actualizamos el Signal para la previsualización en el HTML
        this.previewLogo.set(reader.result as string);

        // 3. Guardamos la referencia en el formulario
        // Nota: Aquí guardas el nombre o la base64 según lo que espere tu Backend
        this.wizardForm.get('empresa.logoUrl')?.setValue(file.name);
      };

      reader.readAsDataURL(file);
    }
  }

  // --- MODOS Y CONFIGURACIÓN ---

  private setupDocValidation() {
    this.wizardForm.get('user.tipoDocumento')?.valueChanges.subscribe(tipo => {
      const docControl = this.wizardForm.get('user.numeroDocumento');
      const length = tipo === 'DNI' ? 8 : 11;
      docControl?.setValidators([
        Validators.required,
        Validators.minLength(length),
        Validators.maxLength(length),
        Validators.pattern('^[0-9]*$')
      ]);
      docControl?.updateValueAndValidity();
    });
  }

  private loadAdminRole() {
    this.roleService.getAllRoles().subscribe(roles => {
      const role = roles.find(r => ['ADMIN', 'ADMIN_RESTAURANTE'].includes(r.name));
      if (role) {
        this.adminRoleId.set(role.id);
        this.wizardForm.get('user.role')?.setValue(role.id);
      }
    });
  }

  private resetWizard() {
    this.currentStep.set(0);
    this.previewLogo.set(null);
    this.wizardForm.reset({
      sucursal: { nombre: 'Sede Principal' },
      user: { tipoDocumento: 'DNI', role: this.adminRoleId() },
      empresa: { fechaAfiliacion: new Date().toISOString().split('T')[0] }
    });
  }

  private setupViewMode() {
    this.wizardForm.patchValue(this.dataToEdit!);
    this.wizardForm.disable();
    if (this.dataToEdit?.logoUrl) this.previewLogo.set(this.dataToEdit.logoUrl);
  }

  private setupEditMode() {
    this.wizardForm.enable();
    this.wizardForm.patchValue(this.dataToEdit!);
    this.wizardForm.get('sucursal')?.disable();
    this.wizardForm.get('user')?.disable();
  }

  private setupCreateMode() {
    this.wizardForm.enable();
  }

  // --- FINALIZACIÓN ---

  saveAll() {
    if (this.loading) return;

    if (this.wizardForm.invalid) {
      this.wizardForm.markAllAsTouched();
      this.scrollToFirstInvalidControl('empresa');
      return;
    }

    this.loading = true;
    const finalData = this.formatDataToUppercase(this.wizardForm.getRawValue());

    this.onComplete.emit({
      data: finalData,
      isEdit: !!this.dataToEdit
    });
  }

  private formatDataToUppercase(data: any) {
    return {
      ...data,
      empresa: {
        ...data.empresa,
        razonSocial: data.empresa.razonSocial?.toUpperCase(),
        direccionFiscal: data.empresa.direccionFiscal?.toUpperCase(),
      },
      user: {
        ...data.user,
        nombres: data.user.nombres?.toUpperCase(),
        apellidoPaterno: data.user.apellidoPaterno?.toUpperCase(),
        apellidoMaterno: data.user.apellidoMaterno?.toUpperCase(),
      }
    };
  }

  close() {
    this.visibleChange.emit(false);
  }

  isFieldInvalid(path: string): boolean {
    const control = this.wizardForm.get(path);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}