let boton = document.getElementById("boton")
let texto = document.getElementById("parrafo")


function ingredientesOrdenados() {
    const opcionSeleccionada = document.querySelector('input[name="pago"]:checked');
    if (opcionSeleccionada) {
        texto.textContent="El metodo  de pago escogido es: "+opcionSeleccionada.value
    }else{
        texto.textContent="Selecciona alguna opcion"
    }
    
}

boton.addEventListener('click',()=>ingredientesOrdenados())