const rompecabezas = document.getElementById("rompecabezas");
const selectorImagen = document.getElementById("selectorImagen");
const boton = document.getElementById("nuevoJuego");
const preview = document.getElementById("previewImagen");

let imagenSeleccionada = selectorImagen.value;
preview.src = imagenSeleccionada;

selectorImagen.addEventListener("change", () => {
    imagenSeleccionada = selectorImagen.value;
    preview.src = imagenSeleccionada;
    preview.style.display = "block";
    rompecabezas.innerHTML = "";
});

boton.addEventListener("click", iniciarJuego);

function iniciarJuego() {
    rompecabezas.innerHTML = "";
    preview.style.display = "none";
    let piezas = [];

    for (let fila = 0; fila < 3; fila++) {
        for (let col = 0; col < 3; col++) {
            let pieza = document.createElement("div");
            pieza.classList.add("pieza");
            pieza.style.backgroundImage = `url(${imagenSeleccionada})`;
            pieza.style.backgroundPosition = `${-col * 120}px ${-fila * 120}px`;
            pieza.dataset.correcta = `${fila}-${col}`;
            piezas.push(pieza);
        }
    }

    let posiciones = piezas.map(p => p.style.backgroundPosition);
    posiciones.sort(() => Math.random() - 0.5);

    piezas.forEach((pieza, i) => {
        pieza.style.backgroundPosition = posiciones[i];
        rompecabezas.appendChild(pieza);
        pieza.setAttribute("draggable", true);
    });

    activarDragDrop();
}

function activarDragDrop() {
    const piezas = document.querySelectorAll(".pieza");
    let piezaArrastrada = null;

    piezas.forEach(pieza => {
        pieza.addEventListener("dragstart", () => {
            piezaArrastrada = pieza;
        });
        pieza.addEventListener("dragover", e => {
            e.preventDefault();
        });
        pieza.addEventListener("drop", () => {
            if (piezaArrastrada !== pieza) {
                let temp = pieza.style.backgroundPosition;
                pieza.style.backgroundPosition = piezaArrastrada.style.backgroundPosition;
                piezaArrastrada.style.backgroundPosition = temp;
                verificarGanador();
            }
        });
    });
}

function verificarGanador() {
    const piezas = document.querySelectorAll(".pieza");
    let correcto = true;
    piezas.forEach(pieza => {
        if (pieza.style.backgroundPosition !== getPosicionCorrecta(pieza.dataset.correcta)) {
            correcto = false;
        }
    });
    if (correcto) {
        setTimeout(() => {
            alert("¡Wow, eres un crack! 🎉🧩");
            preview.style.display = "block";
        }, 200);
    }
}

function getPosicionCorrecta(pos) {
    let [fila, col] = pos.split("-").map(Number);
    return `${-col * 120}px ${-fila * 120}px`;
}