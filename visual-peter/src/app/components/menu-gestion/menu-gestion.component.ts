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
  cargandoElementos = false;

  // Elementos predeterminados por categoría
  private elementosPredeterminados: Record<string, MenuItem[]> = {
    'entrada': [
      {
        nombre: 'Ceviche de Camarón',
        descripcion: 'Ceviche tradicional con camarones frescos, limón, cebolla, cilantro y aguacate',
        categoria: 'entrada',
        precio: 12000,
        popular: true,
        imagen: 'assets/images/menu/ceviche.jpg'
      },
      {
        nombre: 'Carpaccio de Res',
        descripcion: 'Finas láminas de res cruda, aceite de oliva, limón, alcaparras y queso parmesano',
        categoria: 'entrada',
        precio: 15000,
        imagen: 'assets/images/menu/carpaccio.jpg'
      },
      {
        nombre: 'Ensalada Mediterránea',
        descripcion: 'Mezcla de lechugas, tomates cherry, aceitunas, queso feta y aderezo de hierbas',
        categoria: 'entrada',
        precio: 9000,
        imagen: 'assets/images/menu/ensalada.jpg'
      },
      {
        nombre: 'Sopa del Día',
        descripcion: 'Preparada diariamente con ingredientes frescos de temporada',
        categoria: 'entrada',
        precio: 8000,
        imagen: 'assets/images/menu/sopa.jpg'
      }
    ],
    'plato principal': [
      {
        nombre: 'Lomo de Res al Vino Tinto',
        descripcion: 'Lomo de res premium cocinado a la perfección, acompañado de salsa de vino tinto y papas al romero',
        categoria: 'plato principal',
        precio: 28000,
        popular: true,
        imagen: 'assets/images/menu/lomo.jpg'
      },
      {
        nombre: 'Salmón a la Plancha',
        descripcion: 'Filete de salmón fresco cocinado a la plancha con salsa de mantequilla y limón, acompañado de vegetales grillados',
        categoria: 'plato principal',
        precio: 26000,
        imagen: 'assets/images/menu/salmon.jpg'
      },
      {
        nombre: 'Pollo al Curry',
        descripcion: 'Pechuga de pollo en salsa cremosa de curry con coco, servido con arroz basmati',
        categoria: 'plato principal',
        precio: 22000,
        imagen: 'assets/images/menu/pollo-curry.jpg'
      },
      {
        nombre: 'Risotto de Champiñones',
        descripcion: 'Arroz italiano cremoso cocinado con champiñones silvestres, vino blanco y queso parmesano',
        categoria: 'plato principal',
        precio: 20000,
        popular: true,
        imagen: 'assets/images/menu/risotto.jpg'
      }
    ],
    'postre': [
      {
        nombre: 'Tiramisú',
        descripcion: 'Postre italiano clásico con capas de bizcocho empapado en café, crema de mascarpone y cacao',
        categoria: 'postre',
        precio: 8500,
        popular: true,
        imagen: 'assets/images/menu/tiramisu.jpg'
      },
      {
        nombre: 'Cheesecake de Frutos Rojos',
        descripcion: 'Tarta de queso cremosa con coulis de frutos rojos frescos',
        categoria: 'postre',
        precio: 7500,
        imagen: 'assets/images/menu/cheesecake.jpg'
      },
      {
        nombre: 'Coulant de Chocolate',
        descripcion: 'Bizcocho tibio de chocolate con centro líquido, acompañado de helado de vainilla',
        categoria: 'postre',
        precio: 9000,
        popular: true,
        imagen: 'assets/images/menu/coulant.jpg'
      }
    ],
    'bebida': [
      {
        nombre: 'Limonada de Coco',
        descripcion: 'Refrescante limonada casera con crema de coco',
        categoria: 'bebida',
        precio: 6000,
        popular: true,
        imagen: 'assets/images/menu/limonada-coco.jpg'
      },
      {
        nombre: 'Jugo Natural',
        descripcion: 'Jugo de frutas frescas de temporada',
        categoria: 'bebida',
        precio: 5000,
        imagen: 'assets/images/menu/jugo.jpg'
      },
      {
        nombre: 'Agua Mineral',
        descripcion: 'Botella de agua mineral con o sin gas',
        categoria: 'bebida',
        precio: 3500,
        imagen: 'assets/images/menu/agua.jpg'
      },
      {
        nombre: 'Café Especial',
        descripcion: 'Café colombiano de origen único, preparado a su elección',
        categoria: 'bebida',
        precio: 4500,
        imagen: 'assets/images/menu/cafe.jpg'
      }
    ]
  };

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.cargarMenus();
  }

  cargarMenus(): void {
    // Cargar todos los menús
    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        // Corregir menús sin precios en ítems
        const menusCorregidos = this.corregirMenusSinPrecios(menus);

        // Separar en fijos y diarios
        this.menusFijos = menusCorregidos.filter(menu => menu.tipo !== 'diario');
        this.menusDiarios = menusCorregidos.filter(menu => menu.tipo === 'diario');
      },
      error: (error) => {
        console.error('Error al cargar los menús:', error);
        alert('No se pudieron cargar los menús. Por favor, intenta nuevamente.');
      }
    });
  }

  /**
   * Corrige los menús cuyos ítems no tienen precio asignado
   * Para el MVP, asigna precios aproximados basados en la categoría
   */
  corregirMenusSinPrecios(menus: Menu[]): Menu[] {
    const menusCorregidos: Menu[] = [];

    // Precios aproximados por categoría
    const preciosPorCategoria: Record<string, number> = {
      'entrada': 10000,
      'plato principal': 25000,
      'postre': 8000,
      'bebida': 5000,
      // valores por defecto para otras categorías
      'default': 15000
    };

    // Recorrer cada menú y corregir precios faltantes
    menus.forEach(menu => {
      const itemsCorregidos: MenuItem[] = [];
      let requiereSalvado = false;

      // Corregir cada ítem
      menu.items.forEach(item => {
        if (item.precio === undefined || item.precio === null || item.precio <= 0) {
          requiereSalvado = true;
          // Asignar precio según categoría o usar valor por defecto
          const precioCategoria = preciosPorCategoria[item.categoria.toLowerCase()] || preciosPorCategoria['default'];

          // Clonar el ítem con el precio corregido
          itemsCorregidos.push({
            ...item,
            precio: precioCategoria
          });

          console.log(`Corregido precio del ítem "${item.nombre}" en menú "${menu.nombre}": $${precioCategoria}`);
        } else {
          // Mantener ítem sin cambios
          itemsCorregidos.push(item);
        }
      });

      // Crear copia del menú con ítems corregidos
      menusCorregidos.push({
        ...menu,
        items: itemsCorregidos
      });

      // Si hubo cambios, actualizar el menú en el servidor
      if (requiereSalvado && menu.id) {
        this.menuService.updateMenu(menu.id, {
          ...menu,
          items: itemsCorregidos
        }).subscribe({
          next: (menuActualizado) => {
            console.log(`Menú "${menu.nombre}" actualizado con precios corregidos`);
          },
          error: (error) => {
            console.error(`Error al actualizar precios del menú "${menu.nombre}":`, error);
          }
        });
      }
    });

    return menusCorregidos;
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
      categoria: 'entrada',
      precio: 0 // Inicializamos el precio con 0
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
    }    // Validar que todos los ítems tengan nombre, descripción y precio válido
    for (const item of this.menuActual.items) {
      if (!item.nombre || !item.descripcion) {
        alert('Todos los ítems deben tener nombre y descripción.');
        return;
      }
      if (item.precio === undefined || item.precio === null || item.precio <= 0) {
        alert(`El ítem "${item.nombre}" debe tener un precio válido mayor a 0.`);
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

  /**
   * Crea elementos predeterminados para el menú
   * Añade ítems de ejemplo para cada categoría (entradas, platos principales, postres, bebidas)
   */
  crearElementosPredeterminados(): void {
    this.cargandoElementos = true;

    // Primero verificamos si ya existen menús con estos elementos
    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        const categoriasExistentes = new Set<string>();

        // Identificar qué categorías ya tienen un menú creado
        menus.forEach(menu => {
          if (menu.nombre.includes('Catálogo de ')) {
            const categoria = menu.nombre.replace('Catálogo de ', '').toLowerCase();
            categoriasExistentes.add(categoria);
          }
        });

        // Para cada categoría que no existe, crear un menú catálogo
        const promesas: Promise<any>[] = [];

        for (const categoria of Object.keys(this.elementosPredeterminados)) {
          // Convertir al formato esperado (pluralizar)
          let categoriaFormateada = categoria;
          if (categoria === 'entrada') categoriaFormateada = 'entradas';
          else if (categoria === 'plato principal') categoriaFormateada = 'platos principales';
          else if (categoria === 'postre') categoriaFormateada = 'postres';
          else if (categoria === 'bebida') categoriaFormateada = 'bebidas';

          // Verificar si ya existe un menú para esta categoría
          if (!categoriasExistentes.has(categoriaFormateada)) {
            // Crear un nuevo menú para la categoría
            const nuevoMenu: Menu = {
              nombre: `Catálogo de ${categoriaFormateada}`,
              descripcion: `Catálogo completo de ${categoriaFormateada} disponibles en el restaurante`,
              tipo: 'fijo',
              precio: 0, // Es un catálogo, no un menú con precio
              items: this.elementosPredeterminados[categoria]
            };

            // Crear el menú en el servidor
            promesas.push(
              new Promise((resolve, reject) => {
                this.menuService.createMenu(nuevoMenu).subscribe({
                  next: (menu) => {
                    console.log(`Menú de ${categoriaFormateada} creado exitosamente`);
                    resolve(menu);
                  },
                  error: (error) => {
                    console.error(`Error al crear menú de ${categoriaFormateada}:`, error);
                    reject(error);
                  }
                });
              })
            );
          }
        }

        // Esperar a que todos los menús se creen y luego recargar
        if (promesas.length > 0) {
          Promise.all(promesas)
            .then(() => {
              this.cargandoElementos = false;
              alert('Elementos predeterminados creados con éxito.');
              this.cargarMenus();
            })
            .catch(() => {
              this.cargandoElementos = false;
              alert('Hubo un error al crear algunos elementos predeterminados.');
              this.cargarMenus();
            });
        } else {
          this.cargandoElementos = false;
          alert('Todos los elementos predeterminados ya han sido creados anteriormente.');
        }
      },
      error: (error) => {
        console.error('Error al verificar menús existentes:', error);
        this.cargandoElementos = false;
        alert('No se pudieron crear los elementos predeterminados. Intente nuevamente.');
      }
    });
  }
}
