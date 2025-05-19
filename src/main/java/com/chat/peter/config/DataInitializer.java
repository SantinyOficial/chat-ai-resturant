package com.chat.peter.config;

import com.chat.peter.model.Menu;
import com.chat.peter.model.MenuItem;
import com.chat.peter.repository.MenuRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Configuración para cargar datos de ejemplo
 */
@Configuration
public class DataInitializer {

    /**
     * Carga datos de ejemplo solo en desarrollo
     */
    @Bean
    @Profile("dev") // Solo se ejecutará si el perfil activo es "dev"
    public CommandLineRunner loadData(MenuRepository menuRepository) {
        return args -> {
            // Solo cargar datos si no hay menús en la base de datos
            if (menuRepository.count() == 0) {
                System.out.println("Cargando menús de ejemplo...");
                
                // Menú diario
                Menu menuDiario = new Menu("Menú del Día", "Nuestro menú diario incluye entrada, plato principal y postre.", "diario", 15.99);
                
                menuDiario.addItem(new MenuItem("Ensalada César", "Lechuga romana, crutones, parmesano y aderezo César", "entrada"));
                menuDiario.addItem(new MenuItem("Sopa de Tomate", "Sopa casera de tomate con albahaca", "entrada"));
                menuDiario.addItem(new MenuItem("Lomo Saltado", "Tradicional lomo saltado con papas fritas y arroz", "plato principal"));
                menuDiario.addItem(new MenuItem("Pasta Alfredo", "Fettuccine con salsa cremosa y pollo a la parrilla", "plato principal"));
                menuDiario.addItem(new MenuItem("Flan de Caramelo", "Flan casero con salsa de caramelo", "postre"));
                menuDiario.addItem(new MenuItem("Helado Artesanal", "Variedad de sabores de helado artesanal", "postre"));
                
                menuRepository.save(menuDiario);
                
                // Menú ejecutivo
                Menu menuEjecutivo = new Menu("Menú Ejecutivo", "Una opción premium para almuerzos de negocios.", "ejecutivo", 25.99);
                
                menuEjecutivo.addItem(new MenuItem("Carpaccio de Res", "Finas láminas de res con aceite de oliva, limón y parmesano", "entrada"));
                menuEjecutivo.addItem(new MenuItem("Langostinos al Ajillo", "Langostinos salteados en aceite de oliva y ajo", "entrada"));
                menuEjecutivo.addItem(new MenuItem("Filete Migñon", "Filete de res con salsa de vino tinto y puré de papas", "plato principal"));
                menuEjecutivo.addItem(new MenuItem("Risotto de Mariscos", "Risotto cremoso con variedad de mariscos", "plato principal"));
                menuEjecutivo.addItem(new MenuItem("Tiramisú", "Clásico postre italiano con café y mascarpone", "postre"));
                menuEjecutivo.addItem(new MenuItem("Panna Cotta", "Con salsa de frutos rojos", "postre"));
                
                menuRepository.save(menuEjecutivo);
                
                // Menú especial fin de semana
                Menu menuEspecial = new Menu("Menú Especial de Fin de Semana", "Una experiencia gastronómica especial para el fin de semana.", "especial", 35.99);
                
                menuEspecial.addItem(new MenuItem("Tabla de Quesos", "Selección de quesos artesanales con frutas y miel", "entrada"));
                menuEspecial.addItem(new MenuItem("Ceviche Mixto", "Pescado y mariscos frescos en limón con choclo y camote", "entrada"));
                menuEspecial.addItem(new MenuItem("Paella Valenciana", "Tradicional paella con pollo, mariscos y azafrán", "plato principal"));
                menuEspecial.addItem(new MenuItem("Churrasco a la Parrilla", "Corte premium de res a la parrilla con chimichurri", "plato principal"));
                menuEspecial.addItem(new MenuItem("Soufflé de Chocolate", "Con helado de vainilla", "postre"));
                menuEspecial.addItem(new MenuItem("Cheesecake de Frutos Rojos", "Tarta de queso con coulis de frutos rojos", "postre"));
                
                menuRepository.save(menuEspecial);
                
                System.out.println("Datos de ejemplo cargados exitosamente!");
            }
        };
    }
}
