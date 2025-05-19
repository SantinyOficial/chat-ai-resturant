package com.chat.peter.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.service.PedidoService;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {
    
    @Autowired
    private PedidoService pedidoService;
    
    @GetMapping
    public ResponseEntity<List<Pedido>> getAllPedidos() {
        return ResponseEntity.ok(pedidoService.getAllPedidos());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Pedido> getPedidoById(@PathVariable String id) {
        Optional<Pedido> pedido = pedidoService.getPedidoById(id);
        return pedido.map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Pedido>> getPedidosByCliente(@PathVariable String clienteId) {
        return ResponseEntity.ok(pedidoService.getPedidosByCliente(clienteId));
    }
    
    @GetMapping("/cliente/{clienteId}/activos")
    public ResponseEntity<List<Pedido>> getPedidosActivosByCliente(@PathVariable String clienteId) {
        return ResponseEntity.ok(pedidoService.getPedidosActivosByCliente(clienteId));
    }
    
    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Pedido>> getPedidosByEstado(@PathVariable String estado) {
        try {
            EstadoPedido estadoPedido = EstadoPedido.valueOf(estado.toUpperCase());
            return ResponseEntity.ok(pedidoService.getPedidosByEstado(estadoPedido));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/mesa/{mesa}")
    public ResponseEntity<List<Pedido>> getPedidosByMesa(@PathVariable int mesa) {
        return ResponseEntity.ok(pedidoService.getPedidosByMesa(mesa));
    }
    
    @PostMapping
    public ResponseEntity<Pedido> crearPedido(@RequestBody Pedido pedido) {
        Pedido nuevoPedido = pedidoService.crearPedido(pedido);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoPedido);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Pedido> actualizarPedido(@PathVariable String id, @RequestBody Pedido pedido) {
        if (!id.equals(pedido.getId())) {
            return ResponseEntity.badRequest().build();
        }
        
        Pedido pedidoActualizado = pedidoService.actualizarPedido(pedido);
        return pedidoActualizado != null ? 
            ResponseEntity.ok(pedidoActualizado) : 
            ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/estado")
    public ResponseEntity<Pedido> actualizarEstadoPedido(
            @PathVariable String id, 
            @RequestParam String estado) {
        try {
            EstadoPedido nuevoEstado = EstadoPedido.valueOf(estado.toUpperCase());
            Pedido pedidoActualizado = pedidoService.actualizarEstadoPedido(id, nuevoEstado);
            return pedidoActualizado != null ? 
                ResponseEntity.ok(pedidoActualizado) : 
                ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPedido(@PathVariable String id) {
        boolean eliminado = pedidoService.eliminarPedido(id);
        return eliminado ? 
            ResponseEntity.noContent().build() : 
            ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Pedido> cancelarPedido(@PathVariable String id) {
        Pedido pedidoCancelado = pedidoService.cancelarPedido(id);
        return pedidoCancelado != null ? 
            ResponseEntity.ok(pedidoCancelado) : 
            ResponseEntity.notFound().build();
    }
}
