import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthProfile, NavigationItem } from '../../models/security/navigation.model';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  navigation = input.required<NavigationItem[]>();
  user = input.required<AuthProfile['user']>();
  logoutRequest = output<void>();

  isMobileMenuOpen = signal(false);

  activeMenu = signal<string | null>(null);

  toggleMenu(itemName: string) {
    if (this.activeMenu() === itemName) {
      this.activeMenu.set(null);
    } else {
      this.activeMenu.set(itemName);
    }
  }

  onLogout() {
    this.logoutRequest.emit();
  }

  // PARA MOVILES
  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }
  onLinkClick() {
    this.isMobileMenuOpen.set(false);
  }
}
