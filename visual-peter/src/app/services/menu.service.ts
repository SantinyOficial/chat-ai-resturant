import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MenuItem {
  nombre: string;
  descripcion: string;
  categoria: string;
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

  getAllMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(this.apiUrl);
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
