import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/chat-asistente', pathMatch: 'full' },
  { path: 'chat-asistente', loadComponent: () => import('./components/chat-asistente/chat-asistente.component').then(m => m.ChatAsistenteComponent) },
  { path: 'pedidos', loadComponent: () => import('./components/pedidos/pedidos.component').then(m => m.PedidosComponent) },
  { path: 'menu', loadComponent: () => import('./components/menu/menu-dinamico/menu-dinamico.component').then(m => m.MenuDinamicoComponent) },
  { path: 'menu-gestion', loadComponent: () => import('./components/menu-gestion/menu-gestion.component').then(m => m.MenuGestionComponent) },
  { path: 'gestion-pedidos', loadComponent: () => import('./components/gestion-pedidos/gestion-pedidos.component').then(m => m.GestionPedidosComponent) },
  { path: '**', redirectTo: '/chat-asistente' }
];
