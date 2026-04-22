import { Router, Routes } from '@angular/router';
import { authGuard, restaurantGuard } from './core/auth/auth.guard';
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
      // --- CONFIGURACIÓN ---
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
      // --- MAESTROS ---
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
          },
          {
            path: 'clientes',
            loadComponent: () => import('./pages/maestro/cliente/cliente.component').then(m => m.ClienteComponent)
          },
          {
            path: 'metodos',
            loadComponent: () => import('./pages/maestro/metodo-pago/metodo-pago.component').then(m => m.MetodoPagoComponent)
          }
        ]
      },
      // --- VENTAS ---
      {
        path: 'ventas',
        children: [
          {
            path: 'caja',
            loadComponent: () => import('./pages/venta/caja/caja.component').then(m => m.CajaComponent)
          },
          {
            path: 'pos',
            children: [
              {
                path: '',
                loadComponent: () => import('./pages/venta/pos/piso-mapa/piso-mapa.component').then(m => m.PisoMapaComponent),
                title: 'Selección de Mesa'
              }
            ]
          },
          {
            path: 'pre-cuenta',
            loadComponent: () => import('./pages/venta/pre-cuenta/pre-cuenta.component').then(m => m.PreCuentaComponent)
          },
          {
            path: 'facturacion-historial',
            loadComponent: () => import('./pages/venta/facturacion-history/facturacion-history.component').then(m => m.FacturacionHistoryComponent),
            title: 'Historial Facturación'
          }
        ]
      },
      // --- COMPRAS (CON RESTRICCIÓN SUPERADMIN) ---
      {
        path: 'compras',
        canActivate: [restaurantGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/compras/components/compra-list/compra-list.component').then(m => m.CompraListComponent)
          },
          {
            path: 'gestion',
            children: [
              {
                path: '',
                redirectTo: 'nuevo',
                pathMatch: 'full'
              },
              {
                path: 'nuevo',
                loadComponent: () => import('./pages/compras/components/compra-form/compra-form.component').then(m => m.CompraFormComponent)
              }
            ]
          },
          {
            path: 'proveedores',
            loadComponent: () => import('./pages/compras/proveedor/proveedor.component').then(m => m.ProveedorComponent)
          },
          {
            path: 'proveedor/nuevo',
            loadComponent: () => import('./pages/compras/proveedor/modal-proveedor/modal-proveedor.component').then(m => m.ModalProveedorComponent)
          },
          {
            path: 'proveedor/editar/:id',
            loadComponent: () => import('./pages/compras/proveedor/modal-proveedor/modal-proveedor.component').then(m => m.ModalProveedorComponent)
          },
          {
            path: 'productos',
            loadComponent: () => import('./pages/compras/producto/producto.component').then(m => m.ProductoComponent)
          },
          {
            path: 'productos/nuevo',
            loadComponent: () => import('./pages/compras/producto/modal-producto/modal-producto.component').then(m => m.ModalProductoComponent)
          },
          {
            path: 'productos/editar/:id',
            loadComponent: () => import('./pages/compras/producto/modal-producto/modal-producto.component').then(m => m.ModalProductoComponent)
          },
          {
            path: 'clasificacion',
            loadComponent: () => import('./pages/compras/gestion-categoria-tipo/gestion-categoria-tipo.component').then(m => m.GestionCategoriaTipoComponent)
          }
        ]
      },
      // --- ALMACÉN ---
      {
        path: 'almacen',
        canActivate: [restaurantGuard], // asumiendo permisos
        children: [
          {
            path: 'stock',
            loadComponent: () => import('./pages/almacen/stock/stock.component').then(m => m.StockComponent)
          },
          {
            path: 'movimientos',
            loadComponent: () => import('./pages/almacen/movimientos/movimientos.component').then(m => m.MovimientosComponent)
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