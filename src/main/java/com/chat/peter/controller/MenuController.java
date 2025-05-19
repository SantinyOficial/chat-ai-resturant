package com.chat.peter.controller;

import com.chat.peter.model.Menu;
import com.chat.peter.model.MenuItem;
import com.chat.peter.service.MenuService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Controlador para gestionar los menús del restaurante
 */
@RestController
@RequestMapping("/api/menus")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true") // Permitir solicitudes solo desde el frontend Angular en desarrollo
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    /**
     * Obtiene todos los menús activos
     */
    @GetMapping
    public ResponseEntity<List<Menu>> getAllActiveMenus() {
        return ResponseEntity.ok(menuService.getAllActiveMenus());
    }

    /**
     * Obtiene un menú por su ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Menu> getMenuById(@PathVariable String id) {
        Optional<Menu> menu = menuService.getMenuById(id);
        return menu.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Obtiene menús por tipo
     */
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<Menu>> getMenusByType(@PathVariable String tipo) {
        return ResponseEntity.ok(menuService.getActiveMenusByType(tipo));
    }

    /**
     * Crea un nuevo menú
     */
    @PostMapping
    public ResponseEntity<Menu> createMenu(@RequestBody Menu menu) {
        return new ResponseEntity<>(menuService.createMenu(menu), HttpStatus.CREATED);
    }

    /**
     * Actualiza un menú existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<Menu> updateMenu(@PathVariable String id, @RequestBody Menu menu) {
        Optional<Menu> existingMenu = menuService.getMenuById(id);
        if (existingMenu.isPresent()) {
            menu.setId(id);
            return ResponseEntity.ok(menuService.updateMenu(menu));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Desactiva un menú
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateMenu(@PathVariable String id) {
        Optional<Menu> menu = menuService.getMenuById(id);
        if (menu.isPresent()) {
            menuService.deactivateMenu(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Agrega un ítem a un menú existente
     */
    @PostMapping("/{id}/items")
    public ResponseEntity<Menu> addItemToMenu(@PathVariable String id, @RequestBody MenuItem item) {
        Menu updatedMenu = menuService.addItemToMenu(id, item);
        if (updatedMenu != null) {
            return ResponseEntity.ok(updatedMenu);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Obtiene la descripción textual de todos los menús para el asistente
     */
    @GetMapping("/description")
    public ResponseEntity<String> getMenusDescription() {
        return ResponseEntity.ok(menuService.getMenusDescription());
    }
}
