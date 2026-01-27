import { Router, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './pages/auth/login/login.component';
import { MainLayoutComponent } from './pages/layouts/main-layout/main-layout.component';
import { inject } from '@angular/core';
import { AuthService } from './core/auth/auth.service';


export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'config',
        children: [
          {
            path: 'permission',
            loadComponent: () => import('./pages/config/permissions/permissions.component').then(m => m.PermissionsComponent)
          },
          {
            path: 'modules',
            loadComponent: () => import('./pages/config/modules/modules.component').then(m => m.ModulesComponent)
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
