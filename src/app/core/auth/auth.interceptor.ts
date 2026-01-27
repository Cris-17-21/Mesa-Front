import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Usamos variables fuera de la función para mantener el estado entre llamadas del interceptor
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Si el error es 401 (o 400 por el error de Hibernate que ya conocemos)
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
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

    return authService.refreshToken({ refreshToken }).pipe(
      switchMap((res) => {
        isRefreshing = false;
        refreshTokenSubject.next(res.accessToken);
        
        // Reintentamos la petición original con el nuevo token
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
    // Si ya hay un refresh en curso, pausamos esta petición hasta que el subject tenga el token
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
  authService.logout();
  // USAMOS router.navigate en lugar de window.location.href para romper el bucle infinito
  if (!router.url.includes('/login')) {
    router.navigate(['/login']);
  }
  return throwError(() => new Error('Sesión expirada'));
};