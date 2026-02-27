import { Component, effect, inject, OnInit, signal, ChangeDetectionStrategy, model, input, output, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

export interface EmpresaWizardData {
  isEdit: boolean;
  data: any;
}

@Component({
  selector: 'app-modal-empresa',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DialogModule,
    StepsModule, ButtonModule, InputTextModule, SelectModule
  ],
  templateUrl: './modal-empresa.component.html',
  styleUrl: './modal-empresa.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush // 1. Activamos OnPush
})
export class ModalEmpresaComponent implements OnInit {
  // Inyecciones
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly consultaService = inject(ConsultaService);
  private readonly destroyRef = inject(DestroyRef);

  // Modelos
  readonly visible = model(false);
  readonly isReadOnly = input(false);
  readonly dataToEdit = input<Empresa | null>(null);
  readonly loading = input(false);
  readonly onComplete = output<EmpresaWizardData>();

  // Signals para estado reactivo
  readonly currentStep = signal(0);
  readonly previewLogo = signal<string | null>(null);
  readonly adminRoleId = signal<string | null>(null);
  readonly searchingRuc = signal(false);
  readonly searchingDni = signal(false);

  readonly steps = signal<MenuItem[]>([
    { label: 'Empresa' },
    { label: 'Sucursal' },
    { label: 'Administrador' }
  ]);

  readonly tiposDoc = [
    { label: 'DNI', value: 'DNI' },
    { label: 'RUC', value: 'RUC' }
  ];

  readonly wizardForm: FormGroup = this.fb.group({
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

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.resetWizard();
        const data = this.dataToEdit();
        if (this.isReadOnly()) {
          this.setupViewMode(data);
        } else if (data) {
          this.setupEditMode(data);
        } else {
          this.setupCreateMode();
        }
      }
    });
  }

  ngOnInit() {
    this.loadAdminRole();
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
      const firstInvalidControl = document.querySelector(`[formGroupName="${groupName}"] .ng-invalid`);
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
      if (!file.type.startsWith('image/')) {
        console.error('El archivo seleccionado no es una imagen');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.previewLogo.set(reader.result as string);
        this.wizardForm.get('empresa.logoUrl')?.setValue(file.name);
      };
      reader.readAsDataURL(file);
    }
  }

  // --- MODOS Y CONFIGURACIÓN ---

  private loadAdminRole() {
    this.roleService.getAllRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(roles => {
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

  private setupViewMode(data: Empresa | null) {
    if (!data) return;
    this.wizardForm.patchValue(data);
    this.wizardForm.disable();
    if (data.logoUrl) this.previewLogo.set(data.logoUrl);
  }

  private setupEditMode(data: Empresa | null) {
    if (!data) return;
    this.wizardForm.enable();
    this.wizardForm.patchValue(data);
    this.wizardForm.get('sucursal')?.disable();
    this.wizardForm.get('user')?.disable();
  }

  private setupCreateMode() {
    this.wizardForm.enable();
    this.wizardForm.get('user.tipoDocumento')?.disable(); // Respetando tu config inicial
  }

  // --- FINALIZACIÓN ---

  saveAll() {
    if (this.loading()) return;

    if (this.wizardForm.invalid) {
      this.wizardForm.markAllAsTouched();
      this.scrollToFirstInvalidControl('empresa');
      return;
    }

    const finalData = this.formatDataToUppercase(this.wizardForm.getRawValue());

    this.onComplete.emit({
      data: finalData,
      isEdit: !!this.dataToEdit()
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
    this.visible.set(false);
  }

  isFieldInvalid(path: string): boolean {
    const control = this.wizardForm.get(path);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}