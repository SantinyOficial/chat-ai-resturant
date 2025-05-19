import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  clientesOpen = true;
  meserosOpen = false;
  sidebarCollapsed = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  toggleClientes() {
    if (!this.sidebarCollapsed) {
      this.clientesOpen = !this.clientesOpen;
    }
  }

  toggleMeseros() {
    if (!this.sidebarCollapsed) {
      this.meserosOpen = !this.meserosOpen;
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    // Cerrar los submenús al colapsar para evitar problemas con las animaciones
    if (this.sidebarCollapsed) {
      this.clientesOpen = false;
      this.meserosOpen = false;
    }
    this.collapsedChange.emit(this.sidebarCollapsed);
  }
}
