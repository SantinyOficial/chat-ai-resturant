package com.chat.peter.repository;

import com.chat.peter.model.Menu;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends MongoRepository<Menu, String> {
    
    List<Menu> findByActivoTrue();
    
    List<Menu> findByActivoTrueAndTipo(String tipo);
    
    Menu findByNombre(String nombre);
}
