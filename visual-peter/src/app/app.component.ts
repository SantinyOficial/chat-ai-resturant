import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Banquetes Peter';
  sidebarCollapsed = false;

  ngOnInit() {
    this.inicializarClienteId();
  }

  /**
   * Genera un ID único y persistente para la sesión del cliente demo
   */
  private inicializarClienteId(): void {
    if (!localStorage.getItem('clienteId')) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const clienteId = `demo-${timestamp}-${random}`;

      localStorage.setItem('clienteId', clienteId);
      console.log('🎯 Cliente ID generado para demo:', clienteId);
    } else {
      console.log('🎯 Cliente ID existente:', localStorage.getItem('clienteId'));
    }
  }

  onSidebarCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }
}
