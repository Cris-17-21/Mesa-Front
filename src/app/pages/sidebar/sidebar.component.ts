import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthProfile, NavigationItem } from '../../models/security/navigation.model';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  navigation = input.required<NavigationItem[]>();
  user = input.required<AuthProfile['user']>();

  logoutRequest = output<void>();
  
  isMobileMenuOpen = signal(false);
  activeMenu = signal<string | null>(null);

  toggleMenu(itemName: string) {
    this.activeMenu.update(current => current === itemName ? null : itemName);
  }

  onLogout() {
    this.authService.logout();
    this.logoutRequest.emit();
    this.router.navigate(['/login']);
  }

  // PARA MOVILES
  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }
  onLinkClick() {
    this.isMobileMenuOpen.set(false);
  }
}
