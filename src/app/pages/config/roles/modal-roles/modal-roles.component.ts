import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { PickListModule } from 'primeng/picklist';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../../../../services/config/role.service';
import { PermissionService } from '../../../../services/config/permission.service';
import { CreateRoleDto, Role } from '../../../../models/security/role.model';
import { Permission } from '../../../../models/security/permission.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-roles',
  imports: [CommonModule, ReactiveFormsModule, DialogModule, PickListModule, InputTextModule],
  templateUrl: './modal-roles.component.html',
  styleUrl: './modal-roles.component.css'
})
export class ModalRolesComponent implements OnInit, OnChanges {

  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);

  @Input() visible = false;
  @Input() roleToEdit: Role | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  roleForm: FormGroup;
  loading = signal(false);

  sourcePermissions = signal<Permission[]>([]); // Disponibles
  targetPermissions = signal<Permission[]>([]); // Seleccionados

  constructor() {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadAllPermissions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.loadAllPermissions(); // Recargamos para tener data fresca

      if (this.roleToEdit) {
        this.roleForm.patchValue(this.roleToEdit);
        this.targetPermissions.set([...this.roleToEdit.permissions]);
      } else {
        this.roleForm.reset();
        this.targetPermissions.set([]);
      }
    }
  }

  loadAllPermissions() {
    this.permissionService.getAllPermissions().subscribe({
      next: (all) => {
        // Si estamos editando, filtramos para que lo que está en 'target' no esté en 'source'
        const targetIds = this.targetPermissions().map(p => p.id);
        this.sourcePermissions.set(all.filter(p => !targetIds.includes(p.id)));
      }
    });
  }

  save() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    // Extraemos solo los IDs para cumplir con el DTO (permissionIds)
    const payload: CreateRoleDto = {
      ...this.roleForm.value,
      permissionIds: this.targetPermissions().map(p => p.id)
    };

    const request = this.roleToEdit
      ? this.roleService.updateRole(payload, this.roleToEdit.id)
      : this.roleService.createRole(payload);

    request.subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: `Rol ${this.roleToEdit ? 'actualizado' : 'creado'} correctamente`,
          icon: 'success',
          confirmButtonColor: '#18181b'
        });
        this.onSave.emit();
        this.close();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar el rol', 'error'),
      complete: () => this.loading.set(false)
    });
  }

  close() {
    this.visibleChange.emit(false);
  }
}
