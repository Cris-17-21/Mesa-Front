import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ButtonModule } from 'primeng/button'
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, HasPermissionDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  totalUsers: number = 0;
  today = new Date();

  ngOnInit() {
    // Obtener total de usuarios para la estadística
    if(this.authService.hasPermission('READ_USER')) {
      this.userService.getAllUsers().subscribe(users => {
        this.totalUsers = Array.isArray(users) ? users.length : 0;
      });
    }
  }
}