let boton = document.getElementById("boton")
let texto = document.getElementById("parrafo")


function ingredientesOrdenados() {
    const opcionSeleccionada = document.querySelectorAll('input[name="ingredientes"]:checked');
    let listaIngredientes = []
    for (const element of opcionSeleccionada) {
        listaIngredientes.push(element.value)
    }
    if (listaIngredientes.length > 0) {
        texto.textContent="Los ingredientes de la pizza son: "+listaIngredientes.join(", ")
    }else{
        texto.textContent="Selecciona alguna opcion"
    }
    
}

boton.addEventListener('click',()=>ingredientesOrdenados())