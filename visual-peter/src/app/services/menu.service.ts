import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MenuItem {
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number; // Precio ya no es opcional
  popular?: boolean;
  imagen?: string;
}

export interface Menu {
  id?: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  precio: number;
  activo?: boolean;
  items: MenuItem[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private apiUrl = '/api/menus';

  constructor(private http: HttpClient) {}

  // Menús por defecto para fallback
  private DEFAULT_MENUS: Menu[] = [
    {
      id: '1',
      nombre: 'Menú Ejecutivo',
      descripcion: 'Carne asada, arroz, ensalada y bebida',
      tipo: 'fijo',
      precio: 35.0,
      activo: true,
      items: [
        { nombre: 'Carne asada', descripcion: '', categoria: 'principal', precio: 20 },
        { nombre: 'Arroz blanco', descripcion: '', categoria: 'acompañamiento', precio: 5 },
        { nombre: 'Ensalada fresca', descripcion: '', categoria: 'entrada', precio: 5 },
        { nombre: 'Jugo natural', descripcion: '', categoria: 'bebida', precio: 5 }
      ]
    },
    {
      id: '2',
      nombre: 'Menú Turista',
      descripcion: 'Pasta con salsa de tomate, pan de ajo y soda',
      tipo: 'diario',
      precio: 25.0,
      activo: true,
      items: [
        { nombre: 'Pasta al dente', descripcion: '', categoria: 'principal', precio: 15 },
        { nombre: 'Pan de ajo', descripcion: '', categoria: 'acompañamiento', precio: 5 },
        { nombre: 'Soda', descripcion: '', categoria: 'bebida', precio: 5 }
      ]
    }
  ];

  getAllMenus(): Observable<Menu[]> {
    const url = `${this.apiUrl}/menus`;
    return this.http.get<Menu[]>(url).pipe(
      catchError(error => {
        console.warn('Error al cargar menús del backend, usando valores por defecto.', error);
        return of(this.DEFAULT_MENUS);
      })
    );
  }

  getMenuById(id: string): Observable<Menu> {
    return this.http.get<Menu>(`${this.apiUrl}/${id}`);
  }

  getMenusByType(tipo: string): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.apiUrl}/tipo/${tipo}`);
  }

  createMenu(menu: Menu): Observable<Menu> {
    return this.http.post<Menu>(this.apiUrl, menu);
  }

  updateMenu(id: string, menu: Menu): Observable<Menu> {
    return this.http.put<Menu>(`${this.apiUrl}/${id}`, menu);
  }

  deactivateMenu(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addItemToMenu(menuId: string, item: MenuItem): Observable<Menu> {
    return this.http.post<Menu>(`${this.apiUrl}/${menuId}/items`, item);
  }

  getMenusDescription(): Observable<string> {
    return this.http.get(`${this.apiUrl}/description`, { responseType: 'text' });
  }
}
