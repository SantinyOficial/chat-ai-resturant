/* global use, db */
// MongoDB Playground para MongoDB Atlas
// Este script te permite conectarte a tu clúster de MongoDB Atlas y migrar datos

// Reemplaza la siguiente URL con tu cadena de conexión de MongoDB Atlas
// Asegúrate de reemplazar <username>, <password> y <cluster> con tus credenciales reales
// const uri = "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/peterdb?retryWrites=true&w=majority";

// Para usar la cadena de conexión, descomenta las siguientes líneas:
// const MongoClient = require('mongodb').MongoClient;
// const client = new MongoClient(uri);
// const db = client.db("peterdb");

// Mientras tanto, vamos a usar la base de datos local para el ejemplo
use('peterdb');

// Insertar documentos en la colección 'menus'
db.getCollection('menus').insertMany([
  {
    'nombre': 'Menú Ejecutivo',
    'descripcion': 'Menú para almuerzos empresariales',
    'precio': 25000,
    'items': [
      { 'nombre': 'Entrada', 'opciones': ['Ensalada César', 'Sopa del día'] },
      { 'nombre': 'Plato Principal', 'opciones': ['Pollo a la plancha', 'Lomo de res', 'Pescado al ajillo'] },
      { 'nombre': 'Postre', 'opciones': ['Flan de caramelo', 'Torta de chocolate'] },
      { 'nombre': 'Bebida', 'opciones': ['Jugo natural', 'Gaseosa', 'Agua'] }
    ],
    'activo': true
  },
  {
    'nombre': 'Menú Celebración',
    'descripcion': 'Ideal para eventos especiales',
    'precio': 35000,
    'items': [
      { 'nombre': 'Entrada', 'opciones': ['Carpaccio de res', 'Camarones al ajillo', 'Ensalada de la casa'] },
      { 'nombre': 'Plato Principal', 'opciones': ['Salmón a la parrilla', 'Filete mignon', 'Risotto de champiñones'] },
      { 'nombre': 'Postre', 'opciones': ['Cheesecake', 'Tiramisú', 'Helado gourmet'] },
      { 'nombre': 'Bebida', 'opciones': ['Vino', 'Cerveza artesanal', 'Jugo natural', 'Agua con gas'] }
    ],
    'activo': true
  }
]);

// Insertar documentos en la colección 'pedidos'
db.getCollection('pedidos').insertMany([
  {
    'cliente': 'Empresa XYZ',
    'fecha': new Date(),
    'menu': 'Menú Ejecutivo',
    'cantidad': 15,
    'selecciones': [
      { 'item': 'Entrada', 'opcion': 'Ensalada César' },
      { 'item': 'Plato Principal', 'opcion': 'Pollo a la plancha' },
      { 'item': 'Postre', 'opcion': 'Flan de caramelo' },
      { 'item': 'Bebida', 'opcion': 'Jugo natural' }
    ],
    'estado': 'PENDIENTE',
    'total': 375000
  }
]);

// Encontrar todos los menús activos
const menus = db.getCollection('menus').find({ 'activo': true }).toArray();
console.log(`Se encontraron ${menus.length} menús activos`);

// Encontrar todos los pedidos pendientes
const pedidosPendientes = db.getCollection('pedidos').find({ 'estado': 'PENDIENTE' }).toArray();
console.log(`Se encontraron ${pedidosPendientes.length} pedidos pendientes`);
