import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. SI LA PETICIÓN ES AL ENDPOINT DE REFRESH, NO HACER NADA ESPECIAL
  // Esto evita que el fallo del refresh intente refrescarse a sí mismo
  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

const handle401Error = (request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
  const refreshToken = authService.getRefreshToken();

  // 2. SI NI SIQUIERA HAY REFRESH TOKEN, LOGOUT DIRECTO
  if (!refreshToken) {
    authService.logout();
    return throwError(() => new Error('No hay refresh token'));
  }

  return authService.refreshToken({ refreshToken }).pipe(
    switchMap((res) => {
      return next(request.clone({
        setHeaders: { Authorization: `Bearer ${res.accessToken}` }
      }));
    }),
    catchError((err) => {
      // 3. SI EL REFRESH FALLA, LIMPIAMOS TODO Y AL LOGIN
      // Esto corta el bucle infinito
      authService.logout();
      window.location.href = '/login'; // Forzamos recarga para limpiar estados
      return throwError(() => err);
    })
  );
};