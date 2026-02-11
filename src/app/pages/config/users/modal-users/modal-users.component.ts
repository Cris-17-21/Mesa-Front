import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role } from '../../../../models/security/role.model';
import { Empresa } from '../../../../models/maestro/empresa.model';
import { Sucursal } from '../../../../models/maestro/sucursal.model';
import { SucursalService } from '../../../../services/maestro/sucursal.service';
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';

@Component({
  selector: 'app-modal-users',
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './modal-users.component.html',
  styleUrl: './modal-users.component.css'
})
export class ModalUsersComponent {

  private fb = inject(FormBuilder);
  private sucursalService = inject(SucursalService);
  private consultaService = inject(ConsultaService);

  @Input() visible = false;
  @Input() dataToEdit: any = null;
  @Input() roles: Role[] = [];
  @Input() empresas: Empresa[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<any>();

  loading = signal(false);
  rolesFiltrados = signal<Role[]>([]);
  sucursalesPorEmpresa = signal<Sucursal[]>([]);

  userForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
    empresaId: ['', Validators.required],
    sucursalId: [{ value: '', disabled: false }, Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]], // Solo 8 números
    nombres: ['', Validators.required],
    apellidoPaterno: ['', Validators.required],
    apellidoMaterno: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.pattern('^9[0-9]{8}$')]], // Inicia con 9 y tiene 9 dígitos
    email: ['', [Validators.required, Validators.email]],
    tipoDocumento: ['DNI'] // Por defecto
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue === true) {
      this.prepareModal();
    }

    // Si cambian los roles, filtramos al SUPERADMIN
    if (changes['roles']) {
      this.rolesFiltrados.set(this.roles.filter(r => r.name !== 'SUPERADMIN'));
    }
  }

  private prepareModal() {
    if (this.dataToEdit) {
      this.userForm.patchValue(this.dataToEdit);
      this.userForm.get('password')?.clearValidators(); // No obligatorio al editar
    } else {
      this.userForm.reset({ tipoDocumento: 'DNI' });
    }
    this.watchFormChanges();
  }

  private watchFormChanges() {

    // 1. ESCUCHAR CAMBIO DE EMPRESA (Llamada al Backend)
    this.userForm.get('empresaId')?.valueChanges.subscribe(empId => {
      const sucursalCtrl = this.userForm.get('sucursalId');

      if (!empId) {
        this.sucursalesPorEmpresa.set([]);
        sucursalCtrl?.setValue(null);
        return;
      }

      // Llamamos a tu nuevo método del servicio
      this.sucursalService.getSucursalByEmpresaId(empId).subscribe({
        next: (data) => {
          this.sucursalesPorEmpresa.set(data);

          // Lógica de edición: Si estamos editando, mantenemos el valor, 
          // si es creación o el ID actual no existe en la nueva lista, limpiamos.
          const currentSucursalId = sucursalCtrl?.value;
          if (!data.find(s => s.id === currentSucursalId)) {
            sucursalCtrl?.setValue(null);
          }
        },
        error: (err) => {
          console.error('Error al cargar sucursales por empresa', err);
          this.sucursalesPorEmpresa.set([]);
        }
      });
    });

    // 2. ESCUCHAR CAMBIO DE ROL (Lógica de deshabilitar sucursal)
    this.userForm.get('role')?.valueChanges.subscribe(roleValue => {
      // Nota: Asegúrate de que roleValue sea el ID o Name según tu HTML
      const selectedRole = this.roles.find(r => r.id === roleValue || r.name === roleValue);
      const sucursalCtrl = this.userForm.get('sucursalId');

      if (selectedRole?.name === 'ADMIN' || selectedRole?.name === 'ADMIN_RESTAURANTE') {
        sucursalCtrl?.disable();
        sucursalCtrl?.clearValidators();
        sucursalCtrl?.setValue(null);
      } else {
        sucursalCtrl?.enable();
        sucursalCtrl?.setValidators(Validators.required);
      }
      sucursalCtrl?.updateValueAndValidity();
    });

    // 3. Validación dinámica de Documento (DNI: 8, RUC: 11)
    this.userForm.get('tipoDocumento')?.valueChanges.subscribe(tipo => {
      const docControl = this.userForm.get('numeroDocumento');
      docControl?.setValue(''); // Limpiamos el valor para evitar confusiones

      if (tipo === 'DNI') {
        docControl?.setValidators([
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(8),
          Validators.pattern('^[0-9]*$') // Solo números
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

  isFieldInvalid(path: string) {
    const control = this.userForm.get(path);
    return control?.invalid && (control.touched || control.dirty);
  }

  save() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.onSave.emit({
      data: this.userForm.getRawValue(),
      isEdit: !!this.dataToEdit
    });
  }

  close() {
    this.visibleChange.emit(false);
  }

  consultarDni() {
    const dni = this.userForm.get('numeroDocumento')?.value;

    // Validamos que tenga 8 dígitos antes de llamar a la API
    if (!dni || dni.length !== 8) {
      // Aquí podrías disparar un mensaje de error tipo Toast si gustas
      return;
    }

    this.consultaService.consultaDni(dni).subscribe({
      next: (data) => {
        console.log(data)
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
        // Opcional: limpiar campos si no encuentra nada
      }
    });
  }
}
