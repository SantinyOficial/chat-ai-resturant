import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/chat-asistente', pathMatch: 'full' },
  { path: 'chat-asistente', loadComponent: () => import('./components/chat-asistente/chat-asistente.component').then(m => m.ChatAsistenteComponent) },
  { path: 'pedidos', loadComponent: () => import('./components/pedidos/pedidos.component').then(m => m.PedidosComponent) },
  { path: 'menu', loadComponent: () => import('./components/menu/menu.component').then(m => m.MenuComponent) },
  { path: 'gestion-pedidos', loadComponent: () => import('./components/gestion-pedidos/gestion-pedidos.component').then(m => m.GestionPedidosComponent) },
  { path: '**', redirectTo: '/chat-asistente' }
];
