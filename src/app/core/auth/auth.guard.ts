import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

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