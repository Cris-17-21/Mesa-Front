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

  openMenus = signal<{ [key: string]: boolean }>({});

  toggleMenu(itemName: string) {
    this.openMenus.update(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  }

  onLogout() {
    this.logoutRequest.emit();
  }
}
