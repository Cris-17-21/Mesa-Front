import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, concat, Observable } from 'rxjs';
import Swal from 'sweetalert2';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

// Modelos y Servicios
import { EmpresaService } from '../../../services/maestro/empresa.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Empresa } from '../../../models/maestro/empresa.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mi-empresa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './mi-empresa.component.html',
  styleUrl: './mi-empresa.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiEmpresaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly previewLogo = signal<string | null>(null);
  readonly logoFile = signal<File | null>(null);
  readonly certificadoFile = signal<File | null>(null);
  readonly selectedCertName = signal<string | null>(null);
  readonly loading = signal(false);
  readonly empresaData = signal<Empresa | null>(null);

  readonly entornosSunat = [
    { label: 'Desarrollo / Homologación', value: false },
    { label: 'Producción', value: true }
  ];

  readonly empresaForm: FormGroup = this.fb.group({
    ruc: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern('^[0-9]*$')]],
    razonSocial: ['', Validators.required],
    direccionFiscal: ['', Validators.required],
    telefono: ['', [Validators.minLength(9), Validators.maxLength(9), Validators.pattern('^[0-9]*$')]],
    email: ['', [Validators.email]],
    logoUrl: [''],
    fechaAfiliacion: [{ value: '', disabled: true }],
    usuarioSol: [''],
    claveSol: [''],
    claveCertificado: [''],
    entorno: [false]
  });

  ngOnInit(): void {
    // Proteger vista contra accesos no permitidos
    if (!this.authService.permissions().includes('ROLE_ADMIN_RESTAURANTE')) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const empresaId = this.authService.getEmpresaId();
    if (empresaId) {
      this.loadEmpresaData(empresaId);
    } else {
      Swal.fire('Error', 'No se encontró el ID de tu empresa en la sesión activa.', 'error');
    }
  }

  loadEmpresaData(id: string): void {
    this.loading.set(true);
    this.empresaService.getOptionalEmpresa(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.empresaData.set(data);
          this.empresaForm.patchValue(data);
          if (data.logoUrl) {
            this.previewLogo.set(data.logoUrl);
          }
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudieron cargar los datos de la empresa', 'error');
        }
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'El archivo seleccionado no es una imagen', 'error');
        return;
      }

      this.logoFile.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.previewLogo.set(reader.result as string);
        this.empresaForm.get('logoUrl')?.setValue(file.name);
      };
      reader.readAsDataURL(file);
    }
  }

  onCertificadoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.certificadoFile.set(file);
      this.selectedCertName.set(file.name);
    }
  }

  isFieldInvalid(path: string): boolean {
    const control = this.empresaForm.get(path);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  saveEmpresa() {
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    const empresaId = this.authService.getEmpresaId();
    if (!empresaId) {
      Swal.fire('Error', 'No se pudo obtener el ID de la empresa', 'error');
      return;
    }

    this.loading.set(true);
    const rawData = this.empresaForm.getRawValue();

    const payload = {
      ...rawData,
      razonSocial: rawData.razonSocial?.toUpperCase(),
      direccionFiscal: rawData.direccionFiscal?.toUpperCase()
    };

    this.empresaService.updateEmpresa(payload, empresaId).subscribe({
      next: () => {
        this.uploadFilesAndNotify(empresaId);
      },
      error: (err) => {
        this.loading.set(false);
        Swal.fire('Error', err?.error?.message || 'Error al actualizar los datos de la empresa', 'error');
      }
    });
  }

  private uploadFilesAndNotify(empresaId: string) {
    const uploads: Observable<any>[] = [];

    if (this.logoFile()) {
      uploads.push(this.empresaService.subirLogo(empresaId, this.logoFile()!));
    }

    if (this.certificadoFile()) {
      uploads.push(this.empresaService.subirCertificado(empresaId, this.certificadoFile()!));
    }

    if (uploads.length === 0) {
      this.loading.set(false);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Los datos de la empresa se han actualizado correctamente.',
        icon: 'success',
        confirmButtonColor: '#18181b'
      });
      this.loadEmpresaData(empresaId);
      return;
    }

    concat(...uploads).pipe(
      finalize(() => {
        this.loading.set(false);
        this.loadEmpresaData(empresaId);
        this.logoFile.set(null);
        this.certificadoFile.set(null);
        this.selectedCertName.set(null);
      })
    ).subscribe({
      complete: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Los datos y archivos de la empresa se han actualizado correctamente.',
          icon: 'success',
          confirmButtonColor: '#18181b'
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Actualizado parcialmente',
          text: 'Se guardaron los datos básicos, pero hubo un error al subir el logo o certificado digital.',
          icon: 'warning',
          confirmButtonColor: '#18181b'
        });
      }
    });
  }
}
