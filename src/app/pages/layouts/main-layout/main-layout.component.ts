import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user/user.service';
import { AuthProfile } from '../../../models/security/navigation.model';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent, HeaderComponent],
  standalone: true,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

  private userService = inject(UserService);
  private authService = inject(AuthService);
  userProfile?: AuthProfile;

  ngOnInit() {
    this.userService.getUserMe().subscribe({
      next: (profile) => {
        this.userProfile = profile;

        // Si no es SuperAdmin, ocultamos el módulo de Roles de la barra lateral
        if (!this.authService.isSuperAdmin() && this.userProfile.navigation) {
          this.userProfile.navigation = this.userProfile.navigation.map(nav => {
            if (nav.children) {
              return {
                ...nav,
                children: nav.children.filter(child => child.urlPath !== '/config/roles')
              };
            }
            return nav;
          });
        }
        // Forzamos el menú de Ventas con todos sus hijos válidos del frontend
        const ventas = this.userProfile.navigation.find(n => 
          n.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'ventas'
        );
        if (ventas) {
          ventas.name = 'Ventas';
          ventas.urlPath = '';
          ventas.children = [
            {
              name: 'Caja',
              urlPath: '/ventas/caja',
              iconName: 'bi bi-wallet',
              order: 1
            },
            {
              name: 'Punto de Venta',
              urlPath: '/ventas/pos',
              iconName: 'bi bi-shop',
              order: 2
            },
            {
              name: 'Despachos / Delivery',
              urlPath: '/ventas/pre-cuenta',
              iconName: 'bi bi-truck',
              order: 3
            },
            {
              name: 'Historial Facturación',
              urlPath: '/ventas/facturacion-historial',
              iconName: 'bi bi-file-earmark-bar-graph',
              order: 4
            }
          ];
        }

        // Forzamos el módulo de Almacén para que tenga Stock y Movimientos
        // Buscamos ignorando mayúsculas y acentos
        const almacen = this.userProfile.navigation.find(n => 
          n.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'almacen'
        );

        if (almacen) {
          almacen.name = 'Almacén'; // Normalizamos el nombre
          almacen.urlPath = ''; // Aseguramos que sea desplegable
          almacen.children = [
            {
              name: 'Stock',
              urlPath: '/almacen/stock',
              iconName: 'bi bi-boxes',
              order: 1
            },
            {
              name: 'Movimientos',
              urlPath: '/almacen/movimientos',
              iconName: 'bi bi-arrow-left-right',
              order: 2
            }
          ];
        }
      },
      error: (err) => console.error('Sesion Invalida', err)
    });
  }
}
