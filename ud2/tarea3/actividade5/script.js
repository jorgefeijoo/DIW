const boton = document.getElementById('boton');
let person;
let mensaje = document.getElementById('mensaje');

function ventana() {
  person = prompt('Please enter your age');
  mensaje.textContent = 'Tu edad es : ' + person;
}

boton.addEventListener('click', () => ventana());
