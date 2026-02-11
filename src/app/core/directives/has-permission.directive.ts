// core/directives/has-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  @Input() set appHasPermission(permission: string) {
    // Usamos un effect o una validación simple. 
    // Como el signal de permisos en el AuthService cambia, 
    // verificamos si el usuario tiene el permiso necesario.
    
    const hasPerm = this.authService.hasPermission(permission);

    if (hasPerm) {
      // Si tiene permiso y el contenedor está vacío, renderizamos
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      // Si no tiene permiso, vaciamos el contenedor (elimina el elemento del DOM)
      this.viewContainer.clear();
    }
  }
}