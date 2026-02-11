import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { SucursalService } from '../../../services/maestro/sucursal.service';
import { UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SelectModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  hidePassword: boolean = true;

  showBranchSelector: boolean = false;
  sucursalesDisponibles: any[] = [];
  selectedSucursal: any = null;
  tempUserId: string = '';
  showLoginForm: boolean = true;
  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private sucursalService: SucursalService,
    private userService: UserService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit() {
    // Detectamos si venimos del Header (queryParams)
    const params = this.router.parseUrl(this.router.url).queryParams;
    const isChangeMode = params['mode'] === 'change-branch';
    const hasSession = !!localStorage.getItem('refreshToken');

    // Si ya hay sesión o venimos a cambiar sede, cargamos el selector
    if (hasSession || isChangeMode) {
      this.showLoginForm = false;
      this.showBranchSelector = true;
      this.obtenerDatosYsucursales();
    }
  }

  obtenerDatosYsucursales() {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Extraemos todo del payload para evitar peticiones HTTP innecesarias
        this.tempUserId = payload.sub; // El username (ej: 'demo')
        this.userId = payload.userId || ''; // Si incluiste el ID en el JWT
        const idEmpresa = payload.empresaId;

        if (!idEmpresa) {
          console.error("El token no contiene empresaId");
          return;
        }

        console.log('Buscando todas las sedes de la empresa:', idEmpresa);
        this.isLoading = true;

        // Solo llamamos a las sucursales, que debería estar permitido para SuperAdmin
        this.sucursalService.getSucursalByEmpresaId(idEmpresa).subscribe({
          next: (sedes) => {
            this.sucursalesDisponibles = sedes.map(s => ({
              id: s.id,
              nombre: s.nombre
            }));
            this.isLoading = false;
          },
          error: (err) => {
            console.error("Error al traer sedes por empresa", err);
            this.isLoading = false;
            // Si esto da 403, el interceptor manejará el refresh sin borrar el storage
            // gracias a que no hay peticiones concurrentes fallando masivamente.
          }
        });
      } catch (e) {
        console.error("Error al decodificar el token", e);
      }
    }
  }

  confirmarSede() {
    if (this.selectedSucursal) {
      this.isLoading = true;

      // 1. Extraemos el token para obtener el userId (sub)
      const token = this.authService.getToken();
      let usuarioFinal = this.tempUserId; // Intento inicial

      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        usuarioFinal = payload.sub; // Aseguramos que sea el 'demo' del token
      }

      if (!usuarioFinal) {
        this.errorMessage = 'No se pudo identificar al usuario. Reintente el login.';
        this.isLoading = false;
        return;
      }

      console.log('Vinculando sede para el usuario:', usuarioFinal);

      this.authService.selectBranch(usuarioFinal, this.selectedSucursal.id).subscribe({
        next: (res) => {
          // 1. Guardamos tokens (esto actualiza permisos automáticamente)
          this.authService.saveTokens(res);

          // 2. ACTUALIZACIÓN REACTIVA
          this.authService.setBranchName(this.selectedSucursal.nombre);

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 100);
        },
        error: (err) => {
          console.error('Error en el back:', err);
          this.errorMessage = 'No tienes permiso para acceder a esta sede';
          this.isLoading = false;
        }
      });
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          if (res.requireSucursalSelection) {
            this.sucursalesDisponibles = res.sucursalesDisponibles;
            this.showBranchSelector = true;
            this.isLoading = false;
            // Extraemos el sub (username) del token temporal para el select-branch
            const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
            this.tempUserId = payload.sub;
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.errorMessage = 'Usuario o contraseña incorrectos';
          this.isLoading = false;
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
