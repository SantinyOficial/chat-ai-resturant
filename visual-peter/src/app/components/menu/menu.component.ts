import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService, Menu, MenuItem } from '../../services/menu.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./menu.component.html',
  styleUrls:['./menu.component.css']
})
export class MenuComponent implements OnInit {
  selectedCategory: string = 'all';
  menusFijos: Menu[] = [];
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
    this.menuService.getMenus().subscribe({
      next: (data) => {
        this.menusFijos = data.filter(menu => menu.tipo === 'fijo');
        this.allItems = data.flatMap(menu => menu.items);
        this.loading = false;
      },
      error: (err) => {
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
