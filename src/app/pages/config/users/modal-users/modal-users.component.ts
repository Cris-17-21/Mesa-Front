import { Component, inject, signal, ChangeDetectionStrategy, model, input, output, DestroyRef, computed } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

// Modelos y Servicios
import { Role } from '../../../../models/security/role.model';
import { Empresa } from '../../../../models/maestro/empresa.model';
import { Sucursal } from '../../../../models/maestro/sucursal.model';
import { SucursalService } from '../../../../services/maestro/sucursal.service';
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';

@Component({
  selector: 'app-modal-users',
  standalone: true,
  imports: [ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './modal-users.component.html',
  styleUrl: './modal-users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalUsersComponent {
  // Inyecciones
  private readonly fb = inject(FormBuilder);
  private readonly sucursalService = inject(SucursalService);
  private readonly consultaService = inject(ConsultaService);
  private readonly destroyRef = inject(DestroyRef);

  // Modelos e Inputs/Outputs reactivos
  readonly visible = model(false);
  readonly dataToEdit = input<any>(null);
  readonly roles = input<Role[]>([]);
  readonly empresas = input<Empresa[]>([]);
  readonly onSave = output<{ data: any, isEdit: boolean }>();

  // Signals para estado local
  readonly loading = signal(false);
  readonly rolesFiltrados = computed(() =>
    this.roles().filter(r => r.name !== 'SUPERADMIN')
  );
  readonly sucursalesPorEmpresa = signal<Sucursal[]>([]);

  readonly userForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
    empresaId: ['', Validators.required],
    sucursalId: [{ value: '', disabled: false }, Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
    nombres: ['', Validators.required],
    apellidoPaterno: ['', Validators.required],
    apellidoMaterno: ['', Validators.required],
    telefono: ['', [Validators.pattern('^9[0-9]{8}$')]],
    email: ['', [Validators.email]],
    tipoDocumento: ['DNI']
  });

  constructor() {
    // Reaccionar a cambios en visibilidad o datos para editar usando observables
    // para evitar bucles infinitos por tracking reactivo
    toObservable(this.visible)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isVisible => {
        if (isVisible) {
          this.prepareModal(this.dataToEdit());
        } else {
          this.userForm.reset({ tipoDocumento: 'DNI' });
          this.lastPreparedId = null;
        }
      });

    // También reaccionar si cambian los datos mientras el modal está abierto
    toObservable(this.dataToEdit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (this.visible() && data) {
          this.prepareModal(data);
        }
      });

    // No es necesario el observable para rolesFiltrados, ahora es computed

    this.watchFormChanges();
  }

  private lastPreparedId: string | null = null;

  private prepareModal(data: any): void {
    if (!data) {
      this.userForm.reset({ tipoDocumento: 'DNI' });
      return;
    }

    // Mapeamos los objetos anidados o los IDs directos (ahora devueltos por el backend)
    let roleId = data.role?.id || data.rol?.id || data.role || data.rol;

    // Convertir nombre de rol a ID si es necesario
    if (roleId && typeof roleId === 'string' && roleId.length < 30) {
      const foundRole = this.roles().find(r => r.name === roleId);
      if (foundRole) roleId = foundRole.id;
    }

    const mappedData = {
      ...data,
      role: roleId,
      empresaId: data.empresaId || data.empresa?.id || data.empresa_id,
      sucursalId: data.sucursalId || data.sucursal?.id || data.sucursal_id
    };

    this.userForm.patchValue(mappedData);
    this.userForm.get('password')?.clearValidators();

    // Si hay empresa, cargamos las sucursales inmediatamente para que el select de sucursal muestre el valor
    const empId = mappedData.empresaId;
    if (empId) {
      this.loading.set(true);
      this.sucursalService.getSucursalByEmpresaId(empId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (sucursales) => {
            this.sucursalesPorEmpresa.set(sucursales);
            // Forzamos el valor de sucursalId después de cargar las opciones
            this.userForm.get('sucursalId')?.setValue(mappedData.sucursalId);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error cargando sucursales iniciales', err);
            this.loading.set(false);
          }
        });
    }

    this.userForm.get('password')?.updateValueAndValidity();
  }

  private watchFormChanges(): void {
    // 1. ESCUCHAR CAMBIO DE EMPRESA
    this.userForm.get('empresaId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(empId => {
        const sucursalCtrl = this.userForm.get('sucursalId');

        if (!empId) {
          this.sucursalesPorEmpresa.set([]);
          sucursalCtrl?.setValue(null);
          return;
        }

        this.loading.set(true);
        this.sucursalService.getSucursalByEmpresaId(empId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data) => {
              this.sucursalesPorEmpresa.set(data);
              const currentSucursalId = sucursalCtrl?.value;
              if (!data.find(s => s.id === currentSucursalId)) {
                sucursalCtrl?.setValue(null);
              }
              this.loading.set(false);
            },
            error: (err) => {
              console.error('Error al cargar sucursales por empresa', err);
              this.sucursalesPorEmpresa.set([]);
              this.loading.set(false);
            }
          });
      });

    // 2. ESCUCHAR CAMBIO DE ROL
    this.userForm.get('role')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(roleValue => {
        const selectedRole = this.roles().find(r => r.id === roleValue || r.name === roleValue);
        const sucursalCtrl = this.userForm.get('sucursalId');

        if (selectedRole?.name === 'ADMIN') {
          sucursalCtrl?.disable();
          sucursalCtrl?.clearValidators();
          sucursalCtrl?.setValue(null);
        } else {
          sucursalCtrl?.enable();
          sucursalCtrl?.setValidators(Validators.required);
        }
        sucursalCtrl?.updateValueAndValidity();
      });

    // 3. Validación dinámica de Documento
    this.userForm.get('tipoDocumento')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tipo => {
        const docControl = this.userForm.get('numeroDocumento');
        docControl?.setValue('');

        if (tipo === 'DNI') {
          docControl?.setValidators([
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(8),
            Validators.pattern('^[0-9]*$')
          ]);
        } else if (tipo === 'RUC') {
          docControl?.setValidators([
            Validators.required,
            Validators.minLength(11),
            Validators.maxLength(11),
            Validators.pattern('^[0-9]*$')
          ]);
        }
        docControl?.updateValueAndValidity();
      });
  }

  isFieldInvalid(path: string): boolean {
    const control = this.userForm.get(path);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  save(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.onSave.emit({
      data: this.userForm.getRawValue(),
      isEdit: !!this.dataToEdit()
    });
  }

  close(): void {
    this.visible.set(false);
  }

  consultarDni(): void {
    const dni = this.userForm.get('numeroDocumento')?.value;
    if (!dni || dni.length !== 8) return;

    this.loading.set(true);
    this.consultaService.consultaDni(dni)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.userForm.patchValue({
            nombres: data.first_name,
            apellidoPaterno: data.first_last_name,
            apellidoMaterno: data.second_last_name
          });
          this.loading.set(false);
        },
        error: (err) => {
          console.error("Error consultando DNI", err);
          this.loading.set(false);
        }
      });
  }
}
