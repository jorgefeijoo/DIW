let colores = document.getElementById('colores');
let boton = document.getElementById('boton');

function cambioColor() {
  if (colores.value == 'azul') {
    document.body.style.backgroundColor = 'blue';
  }

  if (colores.value == 'rojo') {
    document.body.style.backgroundColor = 'red';
  }

  if (colores.value == 'verde') {
    document.body.style.backgroundColor = 'green';
  }
}

boton.addEventListener('click', () => cambioColor());
