package com.chat.peter.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.model.TipoEntrega;

@Repository
public interface PedidoRepository extends MongoRepository<Pedido, String> {
    List<Pedido> findByClienteId(String clienteId);
    List<Pedido> findByEstado(EstadoPedido estado);
    List<Pedido> findByEstadoIn(List<EstadoPedido> estados);
    List<Pedido> findByMesa(int mesa);
    List<Pedido> findByClienteIdAndEstadoNot(String clienteId, EstadoPedido estado);
    List<Pedido> findByEstadoNotIn(List<EstadoPedido> estados);
    List<Pedido> findByTipoEntregaAndEstadoNot(TipoEntrega tipoEntrega, EstadoPedido estado);
    
    // Métodos para comandos de voz por mesa
    List<Pedido> findByMesaAndEstado(Integer mesa, EstadoPedido estado);
    List<Pedido> findByMesaAndEstadoNotIn(Integer mesa, List<EstadoPedido> estados);
}
