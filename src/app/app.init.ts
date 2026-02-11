import { inject } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { UserService } from './services/user/user.service';

// app.init.ts
export function appInitializer() {
  const authService = inject(AuthService);
  const userService = inject(UserService);

  return () => {
    const token = authService.getToken();
    
    if (!token) return Promise.resolve(null);

    // NUEVA VALIDACIÓN: Decodificar el token para ver si tiene sucursalId
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Si es ADMIN (o cualquier rol que necesite sede) y no tiene sucursalId en el token,
    // no intentamos recuperar sesión, dejamos que el flujo de login siga su curso.
    const isSuperAdmin = payload.authorities?.includes('ROLE_SUPER_ADMIN');
    if (!isSuperAdmin && !payload.sucursalId) {
       console.log('Token parcial detectado, esperando selección de sede...');
       return Promise.resolve(null);
    }

    return firstValueFrom(
      userService.getUserMe().pipe(
        tap(() => console.log('Sesión recuperada con éxito')),
        catchError((err) => {
          if (err.status === 401 || err.status === 403) {
            authService.logout();
          }
          return of(null);
        })
      )
    );
  };
}