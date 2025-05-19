package com.chat.peter.service;

import com.chat.peter.model.Menu;
import com.chat.peter.model.MenuItem;
import com.chat.peter.repository.MenuRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MenuService {

    private final MenuRepository menuRepository;

    public MenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }
    
    /**
     * Crea un nuevo menú
     */
    public Menu createMenu(Menu menu) {
        return menuRepository.save(menu);
    }
    
    /**
     * Obtiene todos los menús activos
     */
    public List<Menu> getAllActiveMenus() {
        return menuRepository.findByActivoTrue();
    }
    
    /**
     * Obtiene los menús activos de un tipo específico
     */
    public List<Menu> getActiveMenusByType(String tipo) {
        return menuRepository.findByActivoTrueAndTipo(tipo);
    }
    
    /**
     * Obtiene un menú por su ID
     */
    public Optional<Menu> getMenuById(String id) {
        return menuRepository.findById(id);
    }
    
    /**
     * Actualiza un menú existente
     */
    public Menu updateMenu(Menu menu) {
        return menuRepository.save(menu);
    }
    
    /**
     * Desactiva un menú
     */
    public void deactivateMenu(String id) {
        Optional<Menu> menuOpt = menuRepository.findById(id);
        if (menuOpt.isPresent()) {
            Menu menu = menuOpt.get();
            menu.setActivo(false);
            menuRepository.save(menu);
        }
    }
    
    /**
     * Agrega un ítem a un menú existente
     */
    public Menu addItemToMenu(String menuId, MenuItem item) {
        Optional<Menu> menuOpt = menuRepository.findById(menuId);
        if (menuOpt.isPresent()) {
            Menu menu = menuOpt.get();
            menu.addItem(item);
            return menuRepository.save(menu);
        }
        return null;
    }
    
    /**
     * Retorna una descripción textual de todos los menús activos
     * para ser utilizada por el asistente
     */
    public String getMenusDescription() {
        List<Menu> menus = getAllActiveMenus();
        if (menus.isEmpty()) {
            return "No hay menús disponibles actualmente.";
        }
        
        StringBuilder description = new StringBuilder("Menús disponibles:\n\n");
        
        for (Menu menu : menus) {
            description.append("## ").append(menu.getNombre()).append(" (").append(menu.getTipo()).append(")\n");
            description.append("Precio: $").append(menu.getPrecio()).append("\n");
            description.append(menu.getDescripcion()).append("\n\n");
            
            if (!menu.getItems().isEmpty()) {
                description.append("Incluye:\n");
                for (MenuItem item : menu.getItems()) {
                    description.append("- ").append(item.getNombre())
                             .append(" (").append(item.getCategoria()).append("): ")
                             .append(item.getDescripcion()).append("\n");
                }
                description.append("\n");
            }
        }
        
        return description.toString();
    }
}
