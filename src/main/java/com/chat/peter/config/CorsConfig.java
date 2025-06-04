package com.chat.peter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Permitir peticiones desde GitHub Pages
        config.addAllowedOrigin("https://santinyoficial.github.io");
        // También permitir peticiones de desarrollo local
        config.addAllowedOrigin("http://localhost:4200");
        
        config.addAllowedMethod("*");  // Permitir todos los métodos HTTP (GET, POST, etc.)
        config.addAllowedHeader("*");  // Permitir todos los headers
        config.setAllowCredentials(true);
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}