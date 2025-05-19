package com.chat.peter.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;

@Repository
public interface PedidoRepository extends MongoRepository<Pedido, String> {
    List<Pedido> findByClienteId(String clienteId);
    List<Pedido> findByEstado(EstadoPedido estado);
    List<Pedido> findByMesa(int mesa);
    List<Pedido> findByClienteIdAndEstadoNot(String clienteId, EstadoPedido estado);
}
