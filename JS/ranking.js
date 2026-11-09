// =========================================================
// Ranking global compartido por TODOS los juegos.
// Cada juego llama a guardarPuntaje(puntos) y los puntos se
// suman al mismo documento del jugador en Firestore ("ranking").
// =========================================================
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

// Se conserva la misma clave que usaba el rompecabezas para no perder el nombre ya guardado
const CLAVE_NOMBRE = "rompecabezas_nombre";

export function obtenerNombreJugador() {
    try {
        return localStorage.getItem(CLAVE_NOMBRE);
    } catch {
        return null;
    }
}

export function pedirNombreJugador() {
    let nombre = "";
    while (!nombre) {
        nombre = prompt("¡Primera vez! Ingresa tu nombre para el ranking:");
        if (nombre === null) return null; // el usuario canceló
        nombre = nombre.trim().slice(0, 30);
    }
    try {
        localStorage.setItem(CLAVE_NOMBRE, nombre);
    } catch { /* sin almacenamiento local: se usa solo en esta sesión */ }
    return nombre;
}

/**
 * Suma puntos al jugador en el ranking global.
 * @returns {Promise<boolean>} true si se guardó
 */
export async function guardarPuntaje(puntos) {
    puntos = Math.round(Number(puntos) || 0);
    if (puntos <= 0) return false;

    let nombre = obtenerNombreJugador();
    if (!nombre) {
        nombre = pedirNombreJugador();
        if (!nombre) return false; // no se guarda si canceló sin dar nombre
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
        await mostrarRanking();
        return true;
    } catch (err) {
        console.error("Error guardando puntaje:", err);
        return false;
    }
}

/** Muestra el top 10 global en la lista indicada. */
export async function mostrarRanking(idLista = "listaRanking") {
    const lista = document.getElementById(idLista);
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

            // textContent evita que un nombre con HTML se ejecute en el navegador de otros jugadores
            const spanPuesto = document.createElement("span");
            spanPuesto.className = "ranking-puesto";
            spanPuesto.textContent = `#${puesto}`;

            const spanNombre = document.createElement("span");
            spanNombre.className = "ranking-nombre";
            spanNombre.textContent = d.nombre;

            const spanPuntos = document.createElement("span");
            spanPuntos.className = "ranking-puntos";
            spanPuntos.textContent = `${d.puntaje} pts`;

            li.append(spanPuesto, spanNombre, spanPuntos);
            lista.appendChild(li);
            puesto++;
        });
    } catch (err) {
        console.error("Error cargando ranking:", err);
        lista.innerHTML = "<li>No se pudo cargar el ranking.</li>";
    }
}
