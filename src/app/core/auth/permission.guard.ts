import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasPermission(requiredPermission)) {
      return true;
    }
    
    router.navigate(['/dashboard']);
    return false;
  };
};
