// Script clásico (no módulo): así los juegos funcionan aunque la página se abra con doble clic
(function () {
// =========================================================
// Utilidades compartidas por los juegos de canvas
// =========================================================

const ANCHO = 800;
const ALTO = 500;

/** Teclado + botones táctiles. Devuelve un Set con las teclas activas ("izq", "der", "arriba", "abajo", "disparo"). */
function crearControles(contenedorTactil) {
    const activas = new Set();
    const mapa = {
        ArrowLeft: "izq", KeyA: "izq",
        ArrowRight: "der", KeyD: "der",
        ArrowUp: "arriba", KeyW: "arriba",
        ArrowDown: "abajo", KeyS: "abajo",
        Space: "disparo", Enter: "disparo"
    };

    let habilitado = false;

    window.addEventListener("keydown", e => {
        const accion = mapa[e.code];
        if (!accion || !habilitado) return;
        e.preventDefault(); // evita que las flechas/espacio muevan la página mientras se juega
        activas.add(accion);
    });
    window.addEventListener("keyup", e => {
        const accion = mapa[e.code];
        if (accion) activas.delete(accion);
    });
    window.addEventListener("blur", () => activas.clear());

    if (contenedorTactil) {
        contenedorTactil.querySelectorAll("[data-accion]").forEach(btn => {
            const accion = btn.dataset.accion;
            const soltar = () => { activas.delete(accion); btn.classList.remove("presionado"); };
            btn.addEventListener("pointerdown", e => {
                e.preventDefault();
                btn.setPointerCapture?.(e.pointerId);
                activas.add(accion);
                btn.classList.add("presionado");
            });
            btn.addEventListener("pointerup", soltar);
            btn.addEventListener("pointercancel", soltar);
            btn.addEventListener("lostpointercapture", soltar);
            btn.addEventListener("contextmenu", e => e.preventDefault());
        });
    }

    return {
        activas,
        habilitar(valor) { habilitado = valor; if (!valor) activas.clear(); },
        tiene(accion) { return activas.has(accion); },
        limpiar() { activas.clear(); }
    };
}

/** Bucle de juego con delta de tiempo en segundos. Devuelve una función para detenerlo. */
function iniciarBucle(actualizar) {
    let anterior = performance.now();
    let id = null;
    let activo = true;

    function paso(ahora) {
        if (!activo) return;
        const dt = Math.min((ahora - anterior) / 1000, 0.05);
        anterior = ahora;
        actualizar(dt);
        id = requestAnimationFrame(paso);
    }
    id = requestAnimationFrame(paso);

    return () => { activo = false; cancelAnimationFrame(id); };
}

/** Fondo de estrellas reutilizable. */
function crearEstrellas(cantidad = 120) {
    return Array.from({ length: cantidad }, () => ({
        x: Math.random() * ANCHO,
        y: Math.random() * ALTO,
        r: Math.random() * 1.6 + 0.3,
        v: Math.random() * 40 + 20
    }));
}

function dibujarEstrellas(ctx, estrellas, dt = 0, velocidad = 1) {
    ctx.fillStyle = "#05060f";
    ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = "#ffffff";
    estrellas.forEach(s => {
        s.y += s.v * velocidad * dt;
        if (s.y > ALTO) { s.y = 0; s.x = Math.random() * ANCHO; }
        ctx.globalAlpha = 0.4 + s.r / 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

/** Colores de los cohetes disponibles. */
const COHETES = {
    halcon: { nombre: "Halcón Rojo", cuerpo: "#e8e8ee", detalle: "#f72a05", llama: "#ffb000" },
    cometa: { nombre: "Cometa Azul", cuerpo: "#dfe9ff", detalle: "#2f7bff", llama: "#7fe3ff" },
    nebula: { nombre: "Nébula Verde", cuerpo: "#e6f5e6", detalle: "#1fbf5a", llama: "#c6ff4d" },
    eclipse: { nombre: "Eclipse Morado", cuerpo: "#efe6ff", detalle: "#9b4dff", llama: "#ff6bd6" }
};

/**
 * Dibuja un cohete centrado en (x, y). angulo en radianes (0 = apuntando hacia arriba).
 */
function dibujarCohete(ctx, x, y, angulo, colores, escala = 1, propulsando = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angulo);
    ctx.scale(escala, escala);

    if (propulsando) {
        const largo = 12 + Math.random() * 10;
        ctx.fillStyle = colores.llama;
        ctx.beginPath();
        ctx.moveTo(-6, 16);
        ctx.lineTo(0, 16 + largo);
        ctx.lineTo(6, 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-3, 16);
        ctx.lineTo(0, 16 + largo * 0.5);
        ctx.lineTo(3, 16);
        ctx.closePath();
        ctx.fill();
    }

    // Aletas
    ctx.fillStyle = colores.detalle;
    ctx.beginPath();
    ctx.moveTo(-8, 6); ctx.lineTo(-16, 18); ctx.lineTo(-8, 16); ctx.closePath();
    ctx.moveTo(8, 6); ctx.lineTo(16, 18); ctx.lineTo(8, 16); ctx.closePath();
    ctx.fill();

    // Cuerpo
    ctx.fillStyle = colores.cuerpo;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.quadraticCurveTo(10, -8, 8, 16);
    ctx.lineTo(-8, 16);
    ctx.quadraticCurveTo(-10, -8, 0, -20);
    ctx.closePath();
    ctx.fill();

    // Punta
    ctx.fillStyle = colores.detalle;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.quadraticCurveTo(6, -13, 6.5, -9);
    ctx.lineTo(-6.5, -9);
    ctx.quadraticCurveTo(-6, -13, 0, -20);
    ctx.closePath();
    ctx.fill();

    // Ventana
    ctx.fillStyle = "#1b2a4a";
    ctx.beginPath();
    ctx.arc(0, -1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colores.detalle;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
}

/** Asteroide con forma irregular (se genera una sola vez y se reutiliza). */
function crearFormaAsteroide(radio) {
    const puntos = [];
    const lados = 9 + Math.floor(Math.random() * 4);
    for (let i = 0; i < lados; i++) {
        const a = (i / lados) * Math.PI * 2;
        const r = radio * (0.75 + Math.random() * 0.35);
        puntos.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return puntos;
}

function dibujarAsteroide(ctx, x, y, forma, rotacion = 0, color = "#8a7a6a") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotacion);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#4a3f36";
    ctx.lineWidth = 2;
    ctx.beginPath();
    forma.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

/** Partículas de explosión. */
function crearExplosion(particulas, x, y, color = "#ff7a00", cantidad = 18) {
    for (let i = 0; i < cantidad; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 60 + Math.random() * 180;
        particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.6 + Math.random() * 0.4, color });
    }
}

function actualizarParticulas(ctx, particulas, dt) {
    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vida -= dt;
        if (p.vida <= 0) { particulas.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(p.vida, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
}

function distancia(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Overlay de fin de partida (reutiliza la tarjeta del rompecabezas). */
function mostrarOverlay(titulo, mensaje, puntosTexto, alCerrar) {
    const overlay = document.getElementById("overlayGanador");
    if (!overlay) return;
    overlay.querySelector("h2").textContent = titulo;
    overlay.querySelector(".tarjeta-ganador-mensaje").textContent = mensaje;
    overlay.querySelector("#overlayPuntos").textContent = puntosTexto;
    overlay.classList.add("activo");
    const cerrar = () => {
        overlay.classList.remove("activo");
        overlay.removeEventListener("click", cerrar);
        if (alCerrar) alCerrar();
    };
    // Pequeño retraso para que el mismo clic/toque que terminó la partida no cierre el overlay
    setTimeout(() => overlay.addEventListener("click", cerrar), 300);
}

/** Asteroides cercanos a la Tierra de una fecha (API NeoWs de la NASA). Misma lógica que SERVICIO/api.js. */
async function verAsteroides(fecha) {
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${fecha}&end_date=${fecha}&api_key=ls42GTOyJCrx4nmx9cmxEJDsJWycYlW6UNh90kWa`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
    const datos = await respuesta.json();
    const lista = [];
    Object.values(datos.near_earth_objects).forEach(dia => dia.forEach(obj => {
        const ca = obj.close_approach_data[0];
        lista.push({
            nombre: obj.name,
            diametroMax: obj.estimated_diameter.meters.estimated_diameter_max.toFixed(2),
            peligroso: obj.is_potentially_hazardous_asteroid,
            distanciaKm: parseFloat(ca.miss_distance.kilometers).toFixed(0)
        });
    }));
    return lista;
}

window.Juegos = { ANCHO, ALTO, crearControles, iniciarBucle, crearEstrellas, dibujarEstrellas, COHETES, dibujarCohete, crearFormaAsteroide, dibujarAsteroide, crearExplosion, actualizarParticulas, distancia, mostrarOverlay, verAsteroides };
})();
