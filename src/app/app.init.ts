import { inject } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { UserService } from './services/user/user.service';

export function appInitializer() {
  const authService = inject(AuthService);
  const userService = inject(UserService);

  return () => {
    const token = authService.getToken();
    
    if (!token) {
      return Promise.resolve(null);
    }

    // Convertimos el Observable a Promesa para que Angular ESPERE
    return firstValueFrom(
      userService.getUserMe().pipe(
        tap(profile => {
          console.log('Sesión recuperada con éxito');
          // Aquí deberías guardar el perfil en un Signal en tu AuthService o UserService
        }),
        catchError((err) => {
          console.error('Error recuperando sesión:', err);
          // Solo hacemos logout si el error es realmente un 401 o 403
          if (err.status === 401 || err.status === 403) {
            authService.logout();
          }
          return of(null);
        })
      )
    );
  };
}