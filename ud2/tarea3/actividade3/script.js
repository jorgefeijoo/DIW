const boton = document.getElementById('boton');
const nombre = document.getElementById('nombre');
function mostrarMensaje() {
  console.log(nombre.value);
}

boton.addEventListener('click', () => mostrarMensaje());
