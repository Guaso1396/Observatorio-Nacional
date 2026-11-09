(function () {
const { guardarPuntaje, mostrarRanking } = window.Ranking;

const rompecabezas = document.getElementById("rompecabezas");
const selectorImagen = document.getElementById("selectorImagen");
const boton = document.getElementById("nuevoJuego");
const preview = document.getElementById("previewImagen");

let imagenSeleccionada = selectorImagen.value;
preview.src = imagenSeleccionada;

let inicioPartida = null; // timestamp de cuando empieza el juego actual

// Tamaño de cada pieza, leído desde el CSS (cambia según el breakpoint)
function obtenerTamanoPieza() {
    const ancho = window.innerWidth;
    if (ancho <= 480) return 70;
    if (ancho <= 768) return 90;
    return 120;
}

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
    inicioPartida = Date.now();

    const tam = obtenerTamanoPieza();
    let piezas = [];

    for (let fila = 0; fila < 3; fila++) {
        for (let col = 0; col < 3; col++) {
            let pieza = document.createElement("div");
            pieza.classList.add("pieza");
            pieza.style.backgroundImage = `url(${imagenSeleccionada})`;
            pieza.style.backgroundPosition = `${-col * tam}px ${-fila * tam}px`;
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

    activarInteraccion();
}

function activarInteraccion() {
    const piezas = document.querySelectorAll(".pieza");
    let piezaSeleccionada = null; // usada tanto en drag (desktop) como en tap (móvil)

    function intercambiar(a, b) {
        let temp = a.style.backgroundPosition;
        a.style.backgroundPosition = b.style.backgroundPosition;
        b.style.backgroundPosition = temp;
        verificarGanador();
    }

    piezas.forEach(pieza => {
        // --- Desktop: drag and drop ---
        pieza.addEventListener("dragstart", () => {
            piezaSeleccionada = pieza;
        });
        pieza.addEventListener("dragover", e => {
            e.preventDefault();
        });
        pieza.addEventListener("drop", () => {
            if (piezaSeleccionada && piezaSeleccionada !== pieza) {
                intercambiar(piezaSeleccionada, pieza);
            }
            piezaSeleccionada = null;
        });

        // --- Móvil/touch: tap para seleccionar, tap para intercambiar ---
        pieza.addEventListener("click", () => {
            if (!piezaSeleccionada) {
                piezaSeleccionada = pieza;
                pieza.classList.add("seleccionada");
            } else if (piezaSeleccionada === pieza) {
                pieza.classList.remove("seleccionada");
                piezaSeleccionada = null;
            } else {
                intercambiar(piezaSeleccionada, pieza);
                piezaSeleccionada.classList.remove("seleccionada");
                piezaSeleccionada = null;
            }
        });
    });
}

const overlayGanador = document.getElementById("overlayGanador");
if (overlayGanador) {
    overlayGanador.addEventListener("click", () => {
        overlayGanador.classList.remove("activo");
    });
}

function verificarGanador() {
    const tam = obtenerTamanoPieza();
    const piezas = document.querySelectorAll(".pieza");
    let correcto = true;
    piezas.forEach(pieza => {
        if (pieza.style.backgroundPosition !== getPosicionCorrecta(pieza.dataset.correcta, tam)) {
            correcto = false;
        }
    });
    if (correcto) {
        const segundos = inicioPartida ? Math.round((Date.now() - inicioPartida) / 1000) : null;
        const puntos = calcularPuntos(segundos);

        setTimeout(() => {
            if (overlayGanador) {
                document.getElementById("overlayPuntos").textContent =
                    `+${puntos} puntos (${segundos}s)`;
                overlayGanador.classList.add("activo");
            }
            preview.style.display = "block";
        }, 200);

        guardarPuntaje(puntos);
    }
}

// --- Sistema de puntaje ---
function calcularPuntos(segundos) {
    if (segundos === null) return 50;
    if (segundos <= 30) return 100;
    if (segundos <= 60) return 70;
    if (segundos <= 120) return 50;
    return 30;
}

function getPosicionCorrecta(pos, tam) {
    let [fila, col] = pos.split("-").map(Number);
    return `${-col * tam}px ${-fila * tam}px`;
}

// Si el usuario rota el dispositivo o cambia de tamaño de ventana,
// se reinicia el tablero para que las piezas coincidan con el nuevo tamaño en CSS.
let anchoAnterior = window.innerWidth;
window.addEventListener("resize", () => {
    const cambioBreakpoint =
        (anchoAnterior > 768 && window.innerWidth <= 768) ||
        (anchoAnterior <= 768 && window.innerWidth > 768) ||
        (anchoAnterior > 480 && window.innerWidth <= 480) ||
        (anchoAnterior <= 480 && window.innerWidth > 480);

    if (cambioBreakpoint && rompecabezas.children.length > 0) {
        iniciarJuego();
    }
    anchoAnterior = window.innerWidth;
});

// --- Ranking global (compartido con los demás juegos) ---
mostrarRanking();

})();
