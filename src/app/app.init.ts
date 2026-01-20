import { inject } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { UserService } from './services/user/user.service';

export function appInitializer() {
  // Inyectamos los servicios necesarios
  const authService = inject(AuthService);
  const userService = inject(UserService);

  return () => {
    const token = authService.getToken();
    // Si hay un token, intentamos recuperar el perfil del usuario
    if (token) {
      return userService.getUserMe().pipe(
        // Si el perfil se carga bien, lo guardamos o procesamos
        tap(profile => console.log('Sesión recuperada:', profile.user?.username)),
        
        catchError((err) => {
          // Si el interceptor no logró refrescar el token a tiempo
          // simplemente limpiamos y mandamos null para que la app cargue
          console.warn('Sesión expirada o inválida. Redirigiendo...');
          authService.logout(); 
          return of(null);
        })
      );
    }
    // Si no hay token, la app inicia normalmente (ej: en el login)
    return of(null);
  };
}