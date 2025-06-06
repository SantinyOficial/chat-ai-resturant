// Test para verificar tipos correctos para setInterval/setTimeout en navegador

// En el navegador, setInterval y setTimeout retornan number, no NodeJS.Timeout
let intervalo: number;
let timeout: number;

// Esto debería funcionar en el navegador:
intervalo = setInterval(() => {
  console.log('Test interval');
}, 1000);

timeout = setTimeout(() => {
  console.log('Test timeout');
}, 1000);

// Limpieza
clearInterval(intervalo);
clearTimeout(timeout);

// Test para forEach con tipo explícito
const lista = ['a', 'b', 'c'];
lista.forEach((item: string) => {
  console.log(item);
});

console.log('✅ Test de tipos completado');
