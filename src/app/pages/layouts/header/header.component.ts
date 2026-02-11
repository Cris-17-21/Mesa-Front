// header.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { OverlayPanelModule } from 'primeng/overlaypanel'; // Importante

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, OverlayPanelModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  authService = inject(AuthService);
  router = inject(Router);

  username = computed(() => this.authService.getClaim('sub') || 'Usuario');

  // CONEXIÓN DIRECTA: Ahora reacciona al Signal del AuthService
  sedeActual = computed(() => this.authService.currentBranchName());

  // --- Lógica de Notificaciones ---
  notificaciones = signal([
    { id: 1, titulo: 'Nueva Orden', mensaje: 'Mesa 4 ha solicitado la cuenta', tiempo: 'hace 2 min', leido: false },
    { id: 2, titulo: 'Stock Bajo', mensaje: 'Quedan menos de 5 unidades de Lomo Fino', tiempo: 'hace 15 min', leido: false },
    { id: 3, titulo: 'Sistema', mensaje: 'Cierre de caja programado 23:00', tiempo: 'hace 1 hora', leido: true }
  ]);

  // Contador de no leídas
  unreadCount = computed(() => this.notificaciones().filter(n => !n.leido).length);

  marcarComoLeidas() {
    this.notificaciones.update(notifs => notifs.map(n => ({ ...n, leido: true })));
  }

  cambiarSede() {
    this.router.navigate(['/login'], { queryParams: { mode: 'change-branch' } });
  }

  logout() {
    this.authService.logout();
  }
}