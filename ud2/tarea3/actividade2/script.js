const boton1 = document.getElementById('boton1');
const boton2 = document.getElementById('boton2');

function aceptar() {
  console.log('Aceptado');
}

function cancelado() {
  console.log('Cancelado');
}

boton1.addEventListener('click', () => aceptar());
boton2.addEventListener('click', () => cancelado());
