import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MenuService, Menu, MenuItem } from '../../services/menu.service';

@Component({
  selector: 'app-menu-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './menu-gestion.component.html',
  styleUrls: ['./menu-gestion.component.css']
})
export class MenuGestionComponent implements OnInit {
  activeTab: 'fijos' | 'diarios' = 'fijos';
  menusFijos: Menu[] = [];
  menusDiarios: Menu[] = [];
  formularioVisible = false;
  editando = false;
  menuActual: Menu = this.inicializarMenu();

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.cargarMenus();
  }

  cargarMenus(): void {
    // Cargar todos los menús
    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        // Separar en fijos y diarios
        this.menusFijos = menus.filter(menu => menu.tipo !== 'diario');
        this.menusDiarios = menus.filter(menu => menu.tipo === 'diario');
      },
      error: (error) => {
        console.error('Error al cargar los menús:', error);
        alert('No se pudieron cargar los menús. Por favor, intenta nuevamente.');
      }
    });
  }

  mostrarFormularioCreacion(): void {
    this.editando = false;
    this.menuActual = this.inicializarMenu();
    this.formularioVisible = true;
  }

  editarMenu(menu: Menu): void {
    this.editando = true;
    // Hacer una copia profunda del menú para no modificar el original directamente
    this.menuActual = JSON.parse(JSON.stringify(menu));
    this.formularioVisible = true;
  }

  cerrarFormulario(): void {
    this.formularioVisible = false;
  }

  agregarItem(): void {
    this.menuActual.items.push({
      nombre: '',
      descripcion: '',
      categoria: 'entrada'
    });
  }

  eliminarItem(index: number): void {
    this.menuActual.items.splice(index, 1);
  }

  guardarMenu(): void {
    // Validar campos requeridos
    if (!this.menuActual.nombre || !this.menuActual.descripcion || !this.menuActual.tipo || this.menuActual.precio <= 0) {
      alert('Por favor, completa todos los campos requeridos del menú.');
      return;
    }

    // Validar que haya al menos un ítem
    if (this.menuActual.items.length === 0) {
      alert('El menú debe tener al menos un ítem.');
      return;
    }

    // Validar que todos los ítems tengan nombre y descripción
    for (const item of this.menuActual.items) {
      if (!item.nombre || !item.descripcion) {
        alert('Todos los ítems deben tener nombre y descripción.');
        return;
      }
    }

    if (this.editando && this.menuActual.id) {
      // Actualizar menú existente
      this.menuService.updateMenu(this.menuActual.id, this.menuActual).subscribe({
        next: () => {
          this.cerrarFormulario();
          this.cargarMenus();
        },
        error: (error) => {
          console.error('Error al actualizar el menú:', error);
          alert('No se pudo actualizar el menú. Por favor, intenta nuevamente.');
        }
      });
    } else {
      // Crear nuevo menú
      this.menuService.createMenu(this.menuActual).subscribe({
        next: () => {
          this.cerrarFormulario();
          this.cargarMenus();
        },
        error: (error) => {
          console.error('Error al crear el menú:', error);
          alert('No se pudo crear el menú. Por favor, intenta nuevamente.');
        }
      });
    }
  }

  desactivarMenu(id?: string): void {
    if (!id) return;

    if (confirm('¿Estás seguro de que deseas desactivar este menú?')) {
      this.menuService.deactivateMenu(id).subscribe({
        next: () => {
          this.cargarMenus();
        },
        error: (error) => {
          console.error('Error al desactivar el menú:', error);
          alert('No se pudo desactivar el menú. Por favor, intenta nuevamente.');
        }
      });
    }
  }

  inicializarMenu(): Menu {
    return {
      nombre: '',
      descripcion: '',
      tipo: 'diario',
      precio: 0,
      items: []
    };
  }
}
