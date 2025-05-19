import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
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
    this.collapsedChange.emit(this.sidebarCollapsed);
  }
}
