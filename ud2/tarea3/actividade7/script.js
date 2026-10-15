let usuario = document.getElementById('usuario');
let contraseña = document.getElementById('contraseña');
let boton = document.getElementById('boton');

function informacionLogin() {
  console.log(
    'Tu usuario es : ' +
      usuario.value +
      ' y tu contraseña es: ' +
      contraseña.value,
  );
}

boton.addEventListener('click', () => informacionLogin());
