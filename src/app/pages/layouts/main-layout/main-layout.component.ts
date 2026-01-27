import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user/user.service';
import { AuthProfile } from '../../../models/security/navigation.model';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent],
  standalone: true,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

  private userService = inject(UserService);
  userProfile?: AuthProfile;

  ngOnInit() {
    this.userService.getUserMe().subscribe({
      next: (profile) => this.userProfile = profile,
      error: (err) => console.error('Sesion Invalida', err)
    });
  }
}
