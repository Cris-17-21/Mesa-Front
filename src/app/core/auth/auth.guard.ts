import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { CajaService } from '../../services/venta/caja.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

/**
 * Guard básico de autenticación.
 * Verifica simplemente si el usuario tiene una sesión activa.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

/**
 * Guard para módulos operativos de restaurante (Compras, Ventas, Inventario).
 * 1. Bloquea a SuperAdmin (debe usar el dashboard administrativo).
 * 2. Verifica que otros roles tengan una sede seleccionada.
 */
export const restaurantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Bloqueo total para SuperAdmin en módulos de restaurante
  if (authService.isSuperAdmin()) {
    console.warn('Acceso denegado: El SuperAdmin no tiene permitido entrar a módulos operativos de restaurante.');
    // Redirigimos al login (donde verá el selector si corresponde)
    router.navigate(['/login']); 
    return false;
  }

  // 2. Verificación de Sede para otros roles (Admin de Restaurante, Mozo, etc.)
  if (!authService.getSucursalId()) {
    console.warn('Acceso denegado: Sede no seleccionada.');
    router.navigate(['/login'], { queryParams: { mode: 'change-branch' } });
    return false;
  }
  
  return true;
};

/**
 * Guard para validar si la caja está abierta antes de ingresar a Punto de Venta.
 */
export const cajaGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const cajaService = inject(CajaService);
  const router = inject(Router);

  // 1. Si es SuperAdmin, no opera Punto de Venta, dejamos pasar (aunque restaurantGuard lo bloquearía antes)
  if (authService.isSuperAdmin()) {
    return true;
  }

  const sucursalId = authService.getSucursalId();
  if (!sucursalId) {
    return false;
  }

  try {
    const usuarioId = await authService.getUserId();
    const caja = await firstValueFrom(cajaService.obtenerEstadoCaja(sucursalId, usuarioId));
    const abierta = !!caja && (caja.estado === 'ABIERTA' || caja.estado === 'ABIERTO');

    if (!abierta) {
      Swal.fire({
        title: 'Caja Cerrada',
        text: 'Debe abrir caja para poder ingresar al Punto de Venta. ¿Ir al módulo de caja?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, ir a caja',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#18181b',
        cancelButtonColor: '#d33'
      }).then((result) => {
        if (result.isConfirmed) {
          router.navigate(['/ventas/caja']);
        }
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error validando caja en guard:', error);
    return true; // Dejamos pasar como fallback ante fallos de red
  }
};