const boton = document.getElementById('boton');
const nombre = document.getElementById('nombre');
const apellidos = document.getElementById('apellidos');
const mensaje = document.getElementById('saludo');

function mostrarMensaje() {
  mensaje.textContent =
    'Bienvenido a la pagina ' + nombre.value + ' ' + apellidos.value;
}

boton.addEventListener('click', () => mostrarMensaje());
