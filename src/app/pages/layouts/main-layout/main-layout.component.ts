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
      },
      error: (err) => console.error('Sesion Invalida', err)
    });
  }
}
