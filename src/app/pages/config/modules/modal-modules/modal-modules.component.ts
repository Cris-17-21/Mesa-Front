import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuleService } from '../../../../services/config/module.service';
import { Module } from '../../../../models/security/module.model';
import Swal from 'sweetalert2';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-modal-modules',
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule, FormsModule],
  standalone: true,
  templateUrl: './modal-modules.component.html',
  styleUrl: './modal-modules.component.css'
})
export class ModalModulesComponent implements OnInit, OnChanges {

  private fb = inject(FormBuilder);
  private moduleService = inject(ModuleService);

  @Input() visible = false;
  @Input() moduleToEdit: Module | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<void>();

  moduleForm: FormGroup;
  potentialParents = signal<Module[]>([]);
  isSubmodule = signal(false);
  loading = signal(false);

  constructor() {
    this.moduleForm = this.fb.group({
      name: ['', [Validators.required]],
      displayOrder: [0, [Validators.required, Validators.min(0)]],
      urlPath: ['', [Validators.required]],
      iconName: ['bi-circle', [Validators.required]],
      parentId: [null]
    });
  }

  ngOnInit(): void {
    this.loadPotentialParents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moduleToEdit']?.currentValue) {
      const m = changes['moduleToEdit'].currentValue as Module;
      this.isSubmodule.set(!!m.parent);
      this.moduleForm.patchValue({
        name: m.name,
        displayOrder: m.displayOrder,
        urlPath: m.urlPath,
        iconName: m.iconName,
        parentId: m.parent?.id || null
      });
    } else if (changes['visible']?.currentValue === true && !this.moduleToEdit) {
      this.resetForm();
    }
  }

  loadPotentialParents() {
    this.moduleService.getAllModules().subscribe({
      next: (data) => {
        const filtered = data.filter(m => {
          // 1. No puede ser padre de sí mismo (para evitar ciclos infinitos en edición)
          const isNotSelf = m.id !== this.moduleToEdit?.id;

          // 2. Solo módulos que NO tienen permisos asignados
          // Verificamos si el array de permisos existe y está vacío
          const hasNoPermissions = !m.permissions || m.permissions.length === 0;

          return isNotSelf && hasNoPermissions;
        });

        this.potentialParents.set(filtered);
      },
      error: (err) => console.error('Error al cargar módulos potenciales padres', err)
    });
  }

  save() {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.moduleForm.value;

    const request = this.moduleToEdit
      ? this.moduleService.updateModule(payload, this.moduleToEdit.id)
      : this.moduleService.createModule(payload);

    request.subscribe({
      next: () => {
        Swal.fire({
          title: this.moduleToEdit ? '¡Actualizado!' : '¡Creado!',
          text: 'Módulo procesado correctamente.',
          icon: 'success',
          confirmButtonColor: '#18181b',
          timer: 2000
        });
        this.onSave.emit();
        this.close();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar el módulo', 'error'),
      complete: () => this.loading.set(false)
    });
  }

  resetForm() {
    this.moduleForm.reset({ displayOrder: 0, iconName: 'bi-circle' });
    this.isSubmodule.set(false);
  }

  close() {
    this.visibleChange.emit(false);
  }
}
