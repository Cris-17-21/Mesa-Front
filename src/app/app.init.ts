import { inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { UserService } from './services/user/user.service';

export function appInitializer() {
  // Inyectamos los servicios necesarios
  const authService = inject(AuthService);
  const userService = inject(UserService);

  return () => {
    // Si hay un token, intentamos recuperar el perfil del usuario
    if (authService.getToken()) {
      return userService.getUserMe().pipe(
        catchError((err) => {
          console.error('Error recuperando sesión inicial:', err);
          authService.logout(); // Si el token no sirve, limpiamos
          return of(null);
        })
      );
    }
    // Si no hay token, la app inicia normalmente (ej: en el login)
    return of(null);
  };
}