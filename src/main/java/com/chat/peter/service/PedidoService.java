package com.chat.peter.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.repository.PedidoRepository;

@Service
public class PedidoService {
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    public List<Pedido> getAllPedidos() {
        return pedidoRepository.findAll();
    }
    
    public Optional<Pedido> getPedidoById(String id) {
        return pedidoRepository.findById(id);
    }
    
    public List<Pedido> getPedidosByCliente(String clienteId) {
        return pedidoRepository.findByClienteId(clienteId);
    }
    
    public List<Pedido> getPedidosByEstado(EstadoPedido estado) {
        return pedidoRepository.findByEstado(estado);
    }
    
    public List<Pedido> getPedidosByMesa(int mesa) {
        return pedidoRepository.findByMesa(mesa);
    }
      public List<Pedido> getPedidosActivosByCliente(String clienteId) {
        return pedidoRepository.findByClienteIdAndEstadoNot(clienteId, EstadoPedido.ENTREGADO);
    }
    
    public Pedido crearPedido(Pedido pedido) {
        if (pedido.getItems() == null || pedido.getItems().isEmpty()) {
            throw new IllegalArgumentException("El pedido debe contener al menos un ítem");
        }
        // La fechaCreacion ya se establece en el constructor de Pedido
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.calcularTotal();
        return pedidoRepository.save(pedido);
    }
    
    public Pedido actualizarEstadoPedido(String id, EstadoPedido nuevoEstado) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            pedido.setEstado(nuevoEstado);
            pedido.setFechaActualizacion(LocalDateTime.now());
            return pedidoRepository.save(pedido);
        }
        return null;
    }
    
    public Pedido actualizarPedido(Pedido pedido) {
        if (pedido.getId() != null && pedidoRepository.existsById(pedido.getId())) {
            pedido.setFechaActualizacion(LocalDateTime.now());
            pedido.calcularTotal();
            return pedidoRepository.save(pedido);
        }
        return null;
    }
    
    public boolean eliminarPedido(String id) {
        if (pedidoRepository.existsById(id)) {
            pedidoRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public Pedido cancelarPedido(String id) {
        return actualizarEstadoPedido(id, EstadoPedido.CANCELADO);
    }
}
