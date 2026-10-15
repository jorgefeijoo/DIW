
function mostrarActividad(idActividad) {

    let actividades = document.querySelectorAll('.actividad');
    actividades.forEach(act => act.classList.remove('activa'));

    document.getElementById(idActividad).classList.add('activa');


    document.body.style.backgroundColor = 'white';
}



const botonAct1 = document.getElementById('boton-act1');
botonAct1.addEventListener('click', () => {
    console.log('Enhorabuena has pulsado el boton!! (Actividad 1)');
});


const boton1Act2 = document.getElementById('boton1-act2');
const boton2Act2 = document.getElementById('boton2-act2');
boton1Act2.addEventListener('click', () => console.log('Aceptado'));
boton2Act2.addEventListener('click', () => console.log('Cancelado'));


const botonAct3 = document.getElementById('boton-act3');
const nombreAct3 = document.getElementById('nombre-act3');
botonAct3.addEventListener('click', () => {
    console.log("Nombre introducido:", nombreAct3.value);
});



const botonAct4 = document.getElementById('boton-act4');
const nombreAct4 = document.getElementById('nombre-act4');
const apellidosAct4 = document.getElementById('apellidos-act4');
const saludoAct4 = document.getElementById('saludo-act4');
botonAct4.addEventListener('click', () => {
    saludoAct4.textContent = 'Bienvenido a la pagina ' + nombreAct4.value + ' ' + apellidosAct4.value;
});



const botonAct5 = document.getElementById('boton-act5');
const mensajeAct5 = document.getElementById('mensaje-act5');
botonAct5.addEventListener('click', () => {
    let person = prompt('Please enter your age');
    if (person) {
        mensajeAct5.textContent = 'Tu edad es : ' + person;
    }
});



const coloresAct6 = document.getElementById('colores-act6');
const botonAct6 = document.getElementById('boton-act6');
botonAct6.addEventListener('click', () => {
    if (coloresAct6.value == 'azul') document.body.style.backgroundColor = 'lightblue';
    if (coloresAct6.value == 'rojo') document.body.style.backgroundColor = 'lightcoral';
    if (coloresAct6.value == 'verde') document.body.style.backgroundColor = 'lightgreen';
});



const usuarioAct7 = document.getElementById('usuario-act7');
const contrasenaAct7 = document.getElementById('contrasena-act7');
const botonAct7 = document.getElementById('boton-act7');
botonAct7.addEventListener('click', () => {
    console.log('Tu usuario es: ' + usuarioAct7.value + ' y tu contraseña es: ' + contrasenaAct7.value);
});



const botonAct8 = document.getElementById("boton-act8");
const textoAct8 = document.getElementById("parrafo-act8");
botonAct8.addEventListener('click', () => {
    const opcionSeleccionada = document.querySelector('input[name="pago"]:checked');
    if (opcionSeleccionada) {
        textoAct8.textContent = "El método de pago escogido es: " + opcionSeleccionada.value;
    } else {
        textoAct8.textContent = "Selecciona alguna opción";
    }
});



const botonAct9 = document.getElementById("boton-act9");
const textoAct9 = document.getElementById("parrafo-act9");
botonAct9.addEventListener('click', () => {
    const opcionesSeleccionadas = document.querySelectorAll('input[name="ingredientes"]:checked');
    let listaIngredientes = [];
    for (const element of opcionesSeleccionadas) {
        listaIngredientes.push(element.value);
    }
    if (listaIngredientes.length > 0) {
        textoAct9.textContent = "Los ingredientes de la pizza son: " + listaIngredientes.join(", ");
    } else {
        textoAct9.textContent = "Selecciona alguna opción";
    }
});

   