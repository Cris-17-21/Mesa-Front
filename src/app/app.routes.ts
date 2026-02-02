import { Router, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './pages/auth/login/login.component';
import { MainLayoutComponent } from './pages/layouts/main-layout/main-layout.component';

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
          },
          {
            path: 'roles',
            loadComponent: () => import('./pages/config/roles/roles.component').then(m => m.RolesComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./pages/config/users/users.component').then(m => m.UsersComponent)
          }
        ]
      },
      {
        path: 'maestros',
        children: [
          {
            path: 'empresa',
            loadComponent: () => import('./pages/maestro/empresa/empresa.component').then(m => m.EmpresaComponent)
          },
          {
            path: 'sucursal',
            loadComponent: () => import('./pages/maestro/sucursal/sucursal.component').then(m => m.SucursalComponent)            
          },
          {
            path: 'pisos',
            loadComponent: () => import('./pages/maestro/piso/piso.component').then(m => m.PisoComponent)  
          },
          {
            path: 'mesas',
            loadComponent: () => import('./pages/maestro/mesa/mesa.component').then(m => m.MesaComponent) 
          }
        ]
      },
      {
        path: 'ventas',
        children: [
          {
            path: 'pedidos',
            loadComponent: () => import('./pages/ventas/pedidos/pedidos.component').then(m => m.PedidosComponent)
          }
        ]
      },
      {
        path: 'compras',
        loadChildren: () => import('./pages/compras/compras.routes').then(m => m.COMPRA_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
