import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService, Menu, MenuItem } from '../../../services/menu.service';

@Component({
  selector: 'app-menu-dinamico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-dinamico.component.html',
  styleUrl: './menu-dinamico.component.css'
})
export class MenuDinamicoComponent implements OnInit {
  selectedCategory: string = 'all';
  menusFijos: Menu[] = [];
  menusDiarios: Menu[] = [];
  allItems: MenuItem[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(private menuService: MenuService) {}

  ngOnInit() {
    this.cargarMenus();
  }

  cargarMenus() {
    this.loading = true;
    this.error = null;

    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        // Separar en menús fijos y diarios
        this.menusFijos = menus.filter(menu => menu.tipo !== 'diario');
        this.menusDiarios = menus.filter(menu => menu.tipo === 'diario');

        // Extraer todos los ítems para la vista por categorías
        this.allItems = menus.flatMap(menu => menu.items);

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar los menús:', err);
        this.error = 'Error al cargar los menús. Por favor, inténtelo más tarde.';
        this.loading = false;
      }
    });
  }

  filterCategory(category: string) {
    this.selectedCategory = category;
  }

  showCategory(category: string): boolean {
    return this.selectedCategory === 'all' || this.selectedCategory === category;
  }

  getItemsByCategory(category: string): MenuItem[] {
    return this.allItems.filter(item => item.categoria === category);
  }
}
