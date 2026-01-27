import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermissionService } from '../../../../services/config/permission.service';
import { ModuleService } from '../../../../services/config/module.service';
import { Module } from '../../../../models/security/module.model';
import { Permission } from '../../../../models/security/permission.model';
import Swal from 'sweetalert2';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-modal-permissions',
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, TextareaModule],
  standalone: true,
  templateUrl: './modal-permissions.component.html',
  styleUrl: './modal-permissions.component.css'
})
export class ModalPermissionsComponent implements OnInit, OnChanges {

  private fb = inject(FormBuilder);
  private permissionService = inject(PermissionService);
  private moduleService = inject(ModuleService);

  @Input() visible = false;
  @Input() permissionToEdit: Permission | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  permissionForm: FormGroup;
  modules = signal<Module[]>([]); // Lista de módulos para el select
  loading = signal(false);

  constructor() {
    this.permissionForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      moduleId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Cargamos los módulos al iniciar para el dropdown
    this.loadModules();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permissionToEdit']?.currentValue) {
      const p = changes['permissionToEdit'].currentValue as Permission;
      this.permissionForm.patchValue({
        name: p.name,
        description: p.description,
        moduleId: p.module.id
      });
    } else if (changes['visible']?.currentValue === true && !this.permissionToEdit) {
      this.permissionForm.reset();
    }
  }

  loadModules() {
    this.moduleService.getAllModulesWithoutChildren().subscribe({
      next: (data) => this.modules.set(data),
      error: (err) => console.error('Error cargando módulos', err)
    });
  }

  save() {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return
    };

    this.loading.set(true);
    const payload = this.permissionForm.value;

    const request = this.permissionToEdit
      ? this.permissionService.updatePermission(payload, this.permissionToEdit.id)
      : this.permissionService.createPermission(payload);

    request.subscribe({
      next: () => {
        Swal.fire({
          title: this.permissionToEdit ? '¡Actualizado!' : '¡Creado!',
          text: `El permiso se ha ${this.permissionToEdit ? 'actualizado' : 'creado'} con éxito.`,
          icon: 'success',
          confirmButtonColor: '#18181b',
          timer: 2000
        });
        this.onSave.emit();
        this.close();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
      },
      complete: () => this.loading.set(false)
    });
  }

  close() {
    this.visibleChange.emit(false);
    this.permissionForm.reset();
  }

}
