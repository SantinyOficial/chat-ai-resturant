import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2><i class="material-icons">restaurant_menu</i> Menú del Restaurante</h2>

      <div class="category-tabs">
        <button class="tab-btn active" (click)="filterCategory('all')">Todos</button>
        <button class="tab-btn" (click)="filterCategory('entrada')">Entradas</button>
        <button class="tab-btn" (click)="filterCategory('principal')">Principales</button>
        <button class="tab-btn" (click)="filterCategory('postre')">Postres</button>
      </div>

      <div class="menu-section" *ngIf="showCategory('entrada')">
        <h3><i class="material-icons">lunch_dining</i> Entradas</h3>
        <div class="menu-grid">
          <div class="menu-card">
            <div class="menu-card-image" style="background-image: url('assets/ceviche.jpg')">
              <span class="card-badge">Popular</span>
            </div>
            <div class="menu-card-content">
              <h4>Ceviche de Camarones</h4>
              <p>Camarones frescos marinados en limón con cebolla, cilantro y un toque de ají.</p>
              <div class="card-footer">
                <span class="price">$15.000</span>
                <button class="add-btn"><i class="material-icons">add</i></button>
              </div>
            </div>
          </div>
          <div class="menu-card">
            <div class="menu-card-image" style="background-image: url('assets/cesar.jpg')"></div>
            <div class="menu-card-content">
              <h4>Ensalada César</h4>
              <p>Lechuga romana, crutones, queso parmesano y aderezo César casero.</p>
              <div class="card-footer">
                <span class="price">$12.000</span>
                <button class="add-btn"><i class="material-icons">add</i></button>
              </div>
            </div>
          </div>
          <div class="menu-card">
            <div class="menu-card-image" style="background-image: url('assets/carpaccio.jpg')"></div>
            <div class="menu-card-content">
              <h4>Carpaccio de Res</h4>
              <p>Finas láminas de res con alcaparras, queso parmesano y aceite de oliva.</p>
              <div class="card-footer">
                <span class="price">$18.000</span>
                <button class="add-btn"><i class="material-icons">add</i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-section" *ngIf="showCategory('principal')">
        <h3><i class="material-icons">restaurant</i> Platos Principales</h3>
        <div class="menu-grid">
          <div class="menu-card">
            <div class="menu-card-content">
              <h4>Filete de Res</h4>
              <p>Corte premium de res a la parrilla, acompañado de puré de papas y vegetales salteados.</p>
              <span class="price">$28.000</span>
            </div>
          </div>
          <div class="menu-card">
            <div class="menu-card-content">
              <h4>Pollo a la Plancha</h4>
              <p>Pechuga de pollo marinada en especias, acompañada de arroz y ensalada fresca.</p>
              <span class="price">$22.000</span>
            </div>
          </div>
          <div class="menu-card">
            <div class="menu-card-content">
              <h4>Salmón Grillado</h4>
              <p>Filete de salmón a la parrilla con salsa de mantequilla y limón, acompañado de espárragos.</p>
              <span class="price">$32.000</span>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-section">
        <h3>Postres</h3>
        <div class="menu-grid">
          <div class="menu-card">
            <div class="menu-card-content">
              <h4>Tiramisú</h4>
              <p>Postre italiano clásico con capas de bizcocho, café y crema de mascarpone.</p>
              <span class="price">$12.000</span>
            </div>
          </div>
          <div class="menu-card">
            <div class="menu-card-content">
              <h4>Flan de Caramelo</h4>
              <p>Flan casero con cobertura de caramelo y bayas frescas.</p>
              <span class="price">$10.000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,  styles: [`
    .container {
      padding: 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2, h3, h4 {
      color: var(--primary-color);
      font-family: 'Quicksand', sans-serif;
    }

    h2 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 1.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    h2 .material-icons {
      font-size: 2rem;
    }

    h3 {
      margin-bottom: 25px;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 8px;
      width: fit-content;
    }

    .category-tabs {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .tab-btn {
      background: transparent;
      color: #fff;
      border: 2px solid var(--primary-color);
      padding: 10px 20px;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: 'Quicksand', sans-serif;
      font-weight: 600;
      font-size: 1rem;
    }

    .tab-btn.active, .tab-btn:hover {
      background: var(--primary-color);
      color: var(--background-dark);
      box-shadow: 0 0 10px rgba(255, 204, 41, 0.5);
    }

    .menu-section {
      margin-bottom: 50px;
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 25px;
    }

    .menu-card {
      background: var(--background-medium);
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      border: 2px solid var(--primary-color);
      transition: all 0.3s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .menu-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 25px rgba(0,0,0,0.2), 0 0 15px var(--primary-color);
    }

    .menu-card-image {
      height: 180px;
      background-size: cover;
      background-position: center;
      position: relative;
      border-bottom: 2px solid var(--primary-color);
    }

    .card-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: var(--primary-color);
      color: var(--background-dark);
      padding: 5px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .menu-card-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .menu-card h4 {
      margin-top: 0;
      font-size: 1.2rem;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .menu-card p {
      color: #ddd;
      margin-bottom: 20px;
      font-size: 0.95rem;
      flex: 1;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
    }

    .price {
      color: var(--primary-color);
      font-weight: bold;
      font-size: 1.3rem;
    }

    .add-btn {
      background: var(--primary-color);
      color: var(--background-dark);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.3s ease;
    }

    .add-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 0 10px rgba(255, 204, 41, 0.5);
    }

    @media (max-width: 1024px) {
      .menu-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      }
    }

    @media (max-width: 768px) {
      .menu-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }

      .category-tabs {
        gap: 10px;
      }

      .tab-btn {
        padding: 8px 15px;
        font-size: 0.9rem;
      }
    }

    @media (max-width: 480px) {
      .menu-grid {
        grid-template-columns: 1fr;
      }

      h2 {
        font-size: 1.5rem;
      }

      h3 {
        font-size: 1.3rem;
      }
    }
  `]
})
export class MenuComponent {
  selectedCategory: string = 'all';

  filterCategory(category: string) {
    this.selectedCategory = category;

    // Actualizar clases activas en los botones
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const activeButton = document.querySelector(`.tab-btn[onclick*="${category}"]`);
    if (activeButton) activeButton.classList.add('active');
  }

  showCategory(category: string): boolean {
    return this.selectedCategory === 'all' || this.selectedCategory === category;
  }
}
