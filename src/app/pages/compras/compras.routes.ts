import { Routes } from '@angular/router';

export const COMPRA_ROUTES: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                loadComponent: () => import('./components/compra-list/compra-list.component').then(m => m.CompraListComponent)
            },
            {
                path: 'nuevo',
                loadComponent: () => import('./components/compra-form/compra-form.component').then(m => m.CompraFormComponent)
            }
        ]
    }
];
