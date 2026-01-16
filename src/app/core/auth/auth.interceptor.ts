import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Clonar peticion con el token actual
  let authReq = req;
  if (token) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error) => {
      // 2. Si el error es 401 (Unauthorized), intentamos refrescar
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

// Función auxiliar para adjuntar el Header
const addTokenHeader = (request: HttpRequest<any>, token: string) => {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
};

// Lógica para refrescar el token
const handle401Error = (request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
  const refreshToken = authService.getRefreshToken();

  if (!refreshToken) {
    authService.logout();
    return throwError(() => new Error('No refresh token available'));
  }

  return authService.refreshToken({ refreshToken }).pipe(
    switchMap((res) => {
      // Si el refresh tiene éxito, reintentamos la petición original con el nuevo token
      return next(addTokenHeader(request, res.accessToken));
    }),
    catchError((err) => {
      // Si el refresh falla (el refresh token también expiró), cerramos sesión
      authService.logout();
      return throwError(() => err);
    })
  );
};