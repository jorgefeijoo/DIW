const boton = document.getElementById('boton');

function mostrarMensaje() {
  console.log('Enhorabuena has pulsado el boton!!');
}

boton.addEventListener('click', () => mostrarMensaje());
