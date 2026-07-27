// Firebase SDK
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, increment,
  query, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9IskWnzGXdYuxyyiguJEWNYuKyuOZTNo",
  authDomain: "observatorio-nacional-76230.firebaseapp.com",
  projectId: "observatorio-nacional-76230",
  storageBucket: "observatorio-nacional-76230.firebasestorage.app",
  messagingSenderId: "524734302519",
  appId: "1:524734302519:web:4c881057bdd51e042932b2",
  measurementId: "G-S5CYF61EWW"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

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

function obtenerNombreJugador() {
    return localStorage.getItem("rompecabezas_nombre");
}

function pedirNombreJugador() {
    let nombre = "";
    while (!nombre) {
        nombre = prompt("¡Primera vez! Ingresa tu nombre para el ranking:");
        if (nombre === null) return null; // el usuario canceló
        nombre = nombre.trim();
    }
    localStorage.setItem("rompecabezas_nombre", nombre);
    return nombre;
}

async function guardarPuntaje(puntos) {
    let nombre = obtenerNombreJugador();
    if (!nombre) {
        nombre = pedirNombreJugador();
        if (!nombre) return; // no se guarda si canceló sin dar nombre
    }

    try {
        const ref = doc(db, "ranking", nombre);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            await setDoc(ref, {
                nombre,
                puntaje: increment(puntos),
                partidas: increment(1)
            }, { merge: true });
        } else {
            await setDoc(ref, {
                nombre,
                puntaje: puntos,
                partidas: 1
            });
        }
        mostrarRanking();
    } catch (err) {
        console.error("Error guardando puntaje:", err);
    }
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

// --- Ranking ---
async function mostrarRanking() {
    const lista = document.getElementById("listaRanking");
    if (!lista) return;
    lista.innerHTML = "<li>Cargando...</li>";

    try {
        const q = query(collection(db, "ranking"), orderBy("puntaje", "desc"), limit(10));
        const snap = await getDocs(q);

        if (snap.empty) {
            lista.innerHTML = "<li>Aún no hay puntajes registrados.</li>";
            return;
        }

        lista.innerHTML = "";
        let puesto = 1;
        snap.forEach(docSnap => {
            const d = docSnap.data();
            const li = document.createElement("li");
            li.innerHTML = `<span class="ranking-puesto">#${puesto}</span> <span class="ranking-nombre">${d.nombre}</span> <span class="ranking-puntos">${d.puntaje} pts</span>`;
            lista.appendChild(li);
            puesto++;
        });
    } catch (err) {
        console.error("Error cargando ranking:", err);
        lista.innerHTML = "<li>No se pudo cargar el ranking.</li>";
    }
}

mostrarRanking();