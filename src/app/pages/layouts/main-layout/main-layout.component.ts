import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user/user.service';
import { AuthProfile } from '../../../models/security/navigation.model';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent, HeaderComponent],
  standalone: true,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

  private userService = inject(UserService);
  userProfile?: AuthProfile;

  ngOnInit() {
    this.userService.getUserMe().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        // Inyectamos manualmente el acceso al historial de facturación para pruebas
        const ventas = this.userProfile.navigation.find(n => n.name === 'Ventas');
        if (ventas) {
          if (!ventas.children) ventas.children = [];
          if (!ventas.children.some(c => c.urlPath === '/ventas/facturacion-historial')) {
            ventas.children.push({
              name: 'Historial Facturación',
              urlPath: '/ventas/facturacion-historial',
              iconName: 'bi bi-clipboard-data-fill',
              order: 99
            });
          }
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
        } else {
          // Si no existe, lo creamos para que el usuario pueda verlo aunque no esté en el DB (como fallback)
          this.userProfile.navigation.push({
            name: 'Almacén',
            urlPath: '',
            iconName: 'bi bi-box-seam',
            order: 5,
            children: [
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
            ]
          });
          this.userProfile.navigation.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      },
      error: (err) => console.error('Sesion Invalida', err)
    });
  }
}
