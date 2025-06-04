"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomicilioService = exports.TipoVehiculo = exports.EstadoDomicilio = void 0;
var core_1 = require("@angular/core");
var EstadoDomicilio;
(function (EstadoDomicilio) {
    EstadoDomicilio["PENDIENTE"] = "PENDIENTE";
    EstadoDomicilio["ASIGNADO"] = "ASIGNADO";
    EstadoDomicilio["EN_CAMINO"] = "EN_CAMINO";
    EstadoDomicilio["ENTREGADO"] = "ENTREGADO";
    EstadoDomicilio["CANCELADO"] = "CANCELADO";
    EstadoDomicilio["DEVUELTO"] = "DEVUELTO";
})(EstadoDomicilio || (exports.EstadoDomicilio = EstadoDomicilio = {}));
var TipoVehiculo;
(function (TipoVehiculo) {
    TipoVehiculo["MOTO"] = "MOTO";
    TipoVehiculo["BICICLETA"] = "BICICLETA";
    TipoVehiculo["CARRO"] = "CARRO";
    TipoVehiculo["PIE"] = "PIE";
})(TipoVehiculo || (exports.TipoVehiculo = TipoVehiculo = {}));
var DomicilioService = function () {
    var _classDecorators = [(0, core_1.Injectable)({
            providedIn: 'root'
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DomicilioService = _classThis = /** @class */ (function () {
        function DomicilioService_1(http) {
            this.http = http;
            this.apiUrl = '/api/domicilios';
        }
        // Configurar pedido para domicilio
        DomicilioService_1.prototype.configurarPedidoDomicilio = function (pedido, direccion) {
            return this.http.post("".concat(this.apiUrl, "/configurar-pedido"), {
                pedido: pedido,
                direccion: direccion
            });
        };
        // Calcular costo de envío
        DomicilioService_1.prototype.calcularCostoEnvio = function (direccion) {
            return this.http.post("".concat(this.apiUrl, "/calcular-costo"), direccion);
        };
        // Obtener pedidos a domicilio pendientes
        DomicilioService_1.prototype.getPedidosDomicilioPendientes = function () {
            return this.http.get("".concat(this.apiUrl, "/pedidos-pendientes"));
        };
        // Obtener seguimiento de un pedido
        DomicilioService_1.prototype.obtenerSeguimiento = function (pedidoId) {
            return this.http.get("".concat(this.apiUrl, "/seguimiento/").concat(pedidoId));
        };
        // Asignar domiciliario a un pedido
        DomicilioService_1.prototype.asignarDomiciliario = function (pedidoId, domiciliarioId) {
            return this.http.post("".concat(this.apiUrl, "/asignar-domiciliario"), {
                pedidoId: pedidoId,
                domiciliarioId: domiciliarioId
            });
        };
        // Actualizar ubicación del domiciliario
        DomicilioService_1.prototype.actualizarUbicacionDomiciliario = function (domiciliarioId, coordenadas) {
            return this.http.put("".concat(this.apiUrl, "/domiciliarios/").concat(domiciliarioId, "/ubicacion"), coordenadas);
        };
        // Actualizar estado del domicilio
        DomicilioService_1.prototype.actualizarEstadoDomicilio = function (pedidoId, estado, observaciones) {
            return this.http.put("".concat(this.apiUrl, "/pedidos/").concat(pedidoId, "/estado"), {
                estado: estado,
                observaciones: observaciones
            });
        };
        // Obtener domiciliarios disponibles
        DomicilioService_1.prototype.getDomiciliariosDisponibles = function () {
            return this.http.get("".concat(this.apiUrl, "/domiciliarios/disponibles"));
        };
        // Obtener todos los domiciliarios
        DomicilioService_1.prototype.getAllDomiciliarios = function () {
            return this.http.get("".concat(this.apiUrl, "/domiciliarios"));
        };
        // Obtener pedidos asignados a un domiciliario
        DomicilioService_1.prototype.getPedidosByDomiciliario = function (domiciliarioId) {
            return this.http.get("".concat(this.apiUrl, "/domiciliarios/").concat(domiciliarioId, "/pedidos"));
        };
        // Obtener configuración de domicilios
        DomicilioService_1.prototype.getConfiguracion = function () {
            return this.http.get("".concat(this.apiUrl, "/configuracion"));
        };
        // Actualizar configuración de domicilios
        DomicilioService_1.prototype.actualizarConfiguracion = function (config) {
            return this.http.put("".concat(this.apiUrl, "/configuracion"), config);
        };
        // Verificar si una dirección está en zona de cobertura
        DomicilioService_1.prototype.verificarZonaCobertura = function (direccion) {
            return this.http.post("".concat(this.apiUrl, "/verificar-cobertura"), direccion);
        };
        // Obtener zonas de cobertura
        DomicilioService_1.prototype.getZonasCobertura = function () {
            return this.http.get("".concat(this.apiUrl, "/zonas-cobertura"));
        };
        // Obtener estadísticas de domicilios
        DomicilioService_1.prototype.getEstadisticasDomicilios = function () {
            return this.http.get("".concat(this.apiUrl, "/estadisticas"));
        };
        // Optimizar rutas para domiciliarios
        DomicilioService_1.prototype.optimizarRutas = function (domiciliarioId) {
            return this.http.post("".concat(this.apiUrl, "/optimizar-rutas"), {
                domiciliarioId: domiciliarioId
            });
        };
        // Notificar cliente sobre estado del pedido
        DomicilioService_1.prototype.notificarCliente = function (pedidoId, mensaje) {
            return this.http.post("".concat(this.apiUrl, "/notificar-cliente"), {
                pedidoId: pedidoId,
                mensaje: mensaje
            });
        };
        // Marcar pedido como entregado
        DomicilioService_1.prototype.marcarPedidoEntregado = function (pedidoId, observaciones) {
            return this.http.post("".concat(this.apiUrl, "/pedidos/").concat(pedidoId, "/entregar"), {
                observaciones: observaciones
            });
        };
        // Reportar problema en la entrega
        DomicilioService_1.prototype.reportarProblema = function (pedidoId, problema, solucion) {
            return this.http.post("".concat(this.apiUrl, "/pedidos/").concat(pedidoId, "/problema"), {
                problema: problema,
                solucion: solucion
            });
        };
        // Obtener historial de entregas de un cliente
        DomicilioService_1.prototype.getHistorialEntregas = function (clienteId) {
            return this.http.get("".concat(this.apiUrl, "/historial-cliente/").concat(clienteId));
        };
        // Calificar domiciliario
        DomicilioService_1.prototype.calificarDomiciliario = function (domiciliarioId, pedidoId, calificacion, comentario) {
            return this.http.post("".concat(this.apiUrl, "/calificar-domiciliario"), {
                domiciliarioId: domiciliarioId,
                pedidoId: pedidoId,
                calificacion: calificacion,
                comentario: comentario
            });
        };
        // Cancelar domicilio
        DomicilioService_1.prototype.cancelarDomicilio = function (pedidoId, motivo) {
            return this.http.post("".concat(this.apiUrl, "/pedidos/").concat(pedidoId, "/cancelar"), {
                motivo: motivo
            });
        };
        // Solicitar domiciliario de emergencia
        DomicilioService_1.prototype.solicitarDomiciliarioEmergencia = function (pedidoId) {
            return this.http.post("".concat(this.apiUrl, "/emergencia/").concat(pedidoId), {});
        };
        return DomicilioService_1;
    }());
    __setFunctionName(_classThis, "DomicilioService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DomicilioService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DomicilioService = _classThis;
}();
exports.DomicilioService = DomicilioService;
