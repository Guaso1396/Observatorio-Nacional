(function () {
const { guardarPuntaje, mostrarRanking } = window.Ranking;

const { ANCHO, ALTO, iniciarBucle, crearEstrellas, dibujarEstrellas, crearFormaAsteroide, dibujarAsteroide, crearExplosion, actualizarParticulas, mostrarOverlay } = window.Juegos;

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const hud = document.getElementById("hud");
const pantallaInicio = document.getElementById("pantallaSeleccion");
const zonaJuego = document.getElementById("zonaJuego");
const estadoApi = document.getElementById("estadoApi");
const estrellas = crearEstrellas();

const TIERRA = { x: ANCHO / 2, y: ALTO + 150, r: 210 };
const CANON = { x: ANCHO / 2, y: ALTO - 62 };

// Nombres reales de asteroides cercanos a la Tierra (API NeoWs de la NASA). Si falla, se usan de respaldo.
let nombresReales = ["(2024 YR4)", "Apophis", "Bennu", "Didymos", "Eros", "Ryugu", "Itokawa", "Toutatis"];
let partida = null;
let detenerBucle = null;

async function cargarNombresNasa() {
    try {
        const hoy = new Date().toISOString().slice(0, 10);
        const lista = await window.Juegos.verAsteroides(hoy);
        if (lista.length) {
            nombresReales = lista.map(a => a.nombre);
            estadoApi.textContent = `🛰️ Hoy la NASA reporta ${lista.length} asteroides cercanos: aparecerán con su nombre real.`;
        }
    } catch {
        estadoApi.textContent = "🛰️ No se pudo consultar la API de la NASA; se usarán nombres de asteroides famosos.";
    }
}
cargarNombresNasa();

document.getElementById("botonJugar").addEventListener("click", iniciar);
document.getElementById("botonReiniciar").addEventListener("click", iniciar);

function iniciar() {
    if (detenerBucle) detenerBucle();
    pantallaInicio.style.display = "none";
    zonaJuego.classList.add("activa");
    lienzo.scrollIntoView({ behavior: "smooth", block: "center" });
    partida = {
        asteroides: [], escudos: [], particulas: [], laseres: [],
        escudo: 100, puntos: 0, nivel: 1, tiempoNivel: 0, siguiente: 1,
        combo: 0, ultimoAcierto: -10, tiempo: 0, destruidos: 0, terminado: false
    };
    detenerBucle = iniciarBucle(actualizar);
}

function crearAsteroide(grande, x, y) {
    const r = grande ? 26 + Math.random() * 12 : 13 + Math.random() * 6;
    const destinoX = TIERRA.x + (Math.random() - 0.5) * 380;
    const ox = x ?? Math.random() * ANCHO;
    const oy = y ?? -40;
    const ang = Math.atan2(ALTO - 40 - oy, destinoX - ox);
    const vel = (grande ? 38 : 60) + partida.nivel * 9 + Math.random() * 20;
    return {
        x: ox, y: oy, r, grande,
        vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
        forma: crearFormaAsteroide(r), rot: 0, vrot: (Math.random() - 0.5) * 2,
        nombre: grande ? nombresReales[Math.floor(Math.random() * nombresReales.length)] : null
    };
}

// Disparo con mouse o toque
lienzo.addEventListener("pointerdown", e => {
    if (!partida || partida.terminado) return;
    e.preventDefault();
    const rect = lienzo.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (ANCHO / rect.width);
    const y = (e.clientY - rect.top) * (ALTO / rect.height);
    partida.laseres.push({ x, y, vida: 0.12 });

    // ¿tocó un escudo?
    const iEscudo = partida.escudos.findIndex(s => Math.hypot(s.x - x, s.y - y) < 26);
    if (iEscudo >= 0) {
        partida.escudo = Math.min(100, partida.escudo + 20);
        partida.escudos.splice(iEscudo, 1);
        return;
    }

    // ¿tocó un asteroide? (zona de toque un poco más grande para celulares)
    let objetivo = null, mejor = Infinity;
    partida.asteroides.forEach(a => {
        const d = Math.hypot(a.x - x, a.y - y);
        if (d < a.r + 12 && d < mejor) { mejor = d; objetivo = a; }
    });

    if (!objetivo) { partida.combo = 0; return; }

    partida.combo = partida.tiempo - partida.ultimoAcierto < 1.5 ? Math.min(partida.combo + 1, 5) : 1;
    partida.ultimoAcierto = partida.tiempo;
    partida.puntos += (objetivo.grande ? 10 : 5) * partida.combo;
    partida.destruidos++;
    crearExplosion(partida.particulas, objetivo.x, objetivo.y, "#ffb000", objetivo.grande ? 24 : 12);
    partida.asteroides.splice(partida.asteroides.indexOf(objetivo), 1);

    // los grandes se parten en dos pequeños
    if (objetivo.grande) {
        for (let i = 0; i < 2; i++) {
            const hijo = crearAsteroide(false, objetivo.x + (i ? 10 : -10), objetivo.y);
            hijo.vx += (i ? 1 : -1) * 40;
            partida.asteroides.push(hijo);
        }
    }
});

function actualizar(dt) {
    const p = partida;
    dibujarEstrellas(ctx, estrellas, dt, 0.4);

    if (!p.terminado) {
        p.tiempo += dt;
        p.tiempoNivel += dt;
        if (p.tiempoNivel > 25) { p.nivel++; p.tiempoNivel = 0; }

        p.siguiente -= dt;
        if (p.siguiente <= 0) {
            p.asteroides.push(crearAsteroide(Math.random() < 0.55));
            p.siguiente = Math.max(0.45, 1.7 - p.nivel * 0.15) * (0.7 + Math.random() * 0.6);
        }
        if (Math.random() < dt * 0.05) {
            p.escudos.push({ x: -20, y: 60 + Math.random() * 180, vx: 90 + Math.random() * 40 });
        }
    }

    // Tierra
    const grad = ctx.createRadialGradient(TIERRA.x - 60, TIERRA.y - 120, 40, TIERRA.x, TIERRA.y, TIERRA.r);
    grad.addColorStop(0, "#5fb4ff");
    grad.addColorStop(0.6, "#1f6fd1");
    grad.addColorStop(1, "#0b2f66");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(TIERRA.x, TIERRA.y, TIERRA.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2fa85a";
    [[-90, -170, 50, 22], [40, -185, 60, 18], [110, -150, 35, 20], [-20, -140, 30, 14]].forEach(([dx, dy, rx, ry]) => {
        ctx.beginPath();
        ctx.ellipse(TIERRA.x + dx, TIERRA.y + dy, rx, ry, 0.3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Escudo (aura)
    ctx.strokeStyle = `rgba(127, 227, 255, ${0.15 + p.escudo / 160})`;
    ctx.lineWidth = 2 + p.escudo / 25;
    ctx.beginPath();
    ctx.arc(TIERRA.x, TIERRA.y, TIERRA.r + 14, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    // Cañón
    ctx.fillStyle = "#cfd6e6";
    ctx.fillRect(CANON.x - 8, CANON.y - 4, 16, 14);

    // Asteroides
    for (let i = p.asteroides.length - 1; i >= 0; i--) {
        const a = p.asteroides[i];
        if (!p.terminado) {
            a.x += a.vx * dt;
            a.y += a.vy * dt;
            a.rot += a.vrot * dt;
        }
        dibujarAsteroide(ctx, a.x, a.y, a.forma, a.rot, a.grande ? "#8a7a6a" : "#a08c78");
        if (a.nombre) {
            ctx.fillStyle = "#ffcf99";
            ctx.font = "11px Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(a.nombre, a.x, a.y - a.r - 6);
        }
        // impacto contra la Tierra
        if (Math.hypot(a.x - TIERRA.x, a.y - TIERRA.y) < TIERRA.r + a.r * 0.5) {
            p.escudo -= a.grande ? 18 : 8;
            p.combo = 0;
            crearExplosion(p.particulas, a.x, a.y, "#ff3355", 20);
            p.asteroides.splice(i, 1);
            if (p.escudo <= 0 && !p.terminado) terminar();
        } else if (a.x < -80 || a.x > ANCHO + 80) {
            p.asteroides.splice(i, 1);
        }
    }

    // Escudos de recarga
    for (let i = p.escudos.length - 1; i >= 0; i--) {
        const s = p.escudos[i];
        s.x += s.vx * dt;
        if (s.x > ANCHO + 30) { p.escudos.splice(i, 1); continue; }
        ctx.font = "26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🛡️", s.x, s.y + 9);
    }

    // Láseres
    for (let i = p.laseres.length - 1; i >= 0; i--) {
        const l = p.laseres[i];
        l.vida -= dt;
        if (l.vida <= 0) { p.laseres.splice(i, 1); continue; }
        ctx.strokeStyle = "#7fe3ff";
        ctx.lineWidth = 3;
        ctx.globalAlpha = l.vida / 0.12;
        ctx.beginPath();
        ctx.moveTo(CANON.x, CANON.y);
        ctx.lineTo(l.x, l.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    actualizarParticulas(ctx, p.particulas, dt);

    if (p.tiempoNivel < 2 && p.nivel > 1 && !p.terminado) {
        ctx.fillStyle = "#ff7a00";
        ctx.font = "bold 34px Oswald, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`¡Nivel ${p.nivel}!`, ANCHO / 2, ALTO / 2 - 40);
    }

    hud.innerHTML = `<span>Nivel: <b>${p.nivel}</b></span>
        <span>Escudo: <b>${Math.max(0, Math.round(p.escudo))}%</b></span>
        <span>Combo: <b>x${Math.max(1, p.combo)}</b></span>
        <span>Destruidos: <b>${p.destruidos}</b></span>
        <span>Puntos: <b>${p.puntos}</b></span>`;
}

function terminar() {
    const p = partida;
    p.terminado = true;
    setTimeout(() => {
        if (detenerBucle) detenerBucle();
        detenerBucle = null;
        mostrarOverlay("🌍 ¡La Tierra fue alcanzada!",
            `Resististe ${Math.round(p.tiempo)} segundos, llegaste al nivel ${p.nivel} y destruiste ${p.destruidos} asteroides.`,
            p.puntos > 0 ? `+${p.puntos} puntos` : "Sin puntos esta vez");
        guardarPuntaje(p.puntos);
    }, 900);
}

mostrarRanking();

})();
