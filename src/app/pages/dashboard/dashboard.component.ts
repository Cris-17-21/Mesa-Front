import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthProfile } from '../../models/security/navigation.model';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile?: AuthProfile;
  totalUsers: number = 0;

  today = new Date();

  ngOnInit() {
    // 1. Obtener mi perfil
    this.userService.getUserMe().subscribe({
      next: (profile) => this.userProfile = profile,
      error: () => this.logout() 
    });

    // 2. Obtener total de usuarios para la estadística
    this.userService.getAllUsers().subscribe(users => {
      this.totalUsers = Array.isArray(users) ? users.length : 0;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}