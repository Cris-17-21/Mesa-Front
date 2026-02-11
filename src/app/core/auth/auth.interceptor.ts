import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Estado para manejar múltiples peticiones durante un refresh
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // No interceptar la propia petición de refresh para evitar bucles infinitos
  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Capturamos 401 y 403 (donde suele caer el SuperAdmin cuando expira el token)
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {

        // Si el error ocurre en login o selección de sede, no intentamos refresh
        if (req.url.includes('/auth/select-branch') || req.url.includes('/auth/login')) {
          return throwError(() => error);
        }

        // Si es un 403, mandamos un aviso a consola pero NO cortamos el flujo,
        // dejamos que intente el refresh por si es una expiración camuflada.
        if (error.status === 403) {
          console.warn('Acceso denegado o token expirado (403). Intentando refrescar sesión...');
        }

        return handleRefreshLogic(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

const handleRefreshLogic = (request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, router: Router) => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();
    
    if (!refreshToken) {
      return finalizeLogout(authService, router);
    }

    // Llamada al servicio de refresh (enviando solo el refreshToken según tu servicio actual)
    return authService.refreshToken({ refreshToken }).pipe(
      switchMap((res) => {
        isRefreshing = false;
        // El servicio ya guarda los tokens y carga el estado inicial según tu código
        refreshTokenSubject.next(res.accessToken);

        // Reintentamos la petición original con el nuevo token de acceso
        return next(request.clone({
          setHeaders: { Authorization: `Bearer ${res.accessToken}` }
        }));
      }),
      catchError((err) => {
        isRefreshing = false;
        return finalizeLogout(authService, router);
      })
    );
  } else {
    // Si ya hay un refresh en curso, las demás peticiones esperan aquí
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(request.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        }));
      })
    );
  }
};

const finalizeLogout = (authService: AuthService, router: Router) => {
  isRefreshing = false;
  authService.logout();
  if (!router.url.includes('/login')) {
    router.navigate(['/login']);
  }
  return throwError(() => new Error('Sesión expirada o sin permisos'));
};