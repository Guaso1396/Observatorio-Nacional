import { guardarPuntaje, mostrarRanking } from "./ranking.js";
import {
    ANCHO, ALTO, COHETES, crearControles, iniciarBucle, crearEstrellas, dibujarEstrellas,
    dibujarCohete, crearExplosion, actualizarParticulas, mostrarOverlay
} from "./juegos-comun.js";

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const hud = document.getElementById("hud");
const pantallaInicio = document.getElementById("pantallaSeleccion");
const zonaJuego = document.getElementById("zonaJuego");
const selectorCohete = document.getElementById("selectorCohete");
const controles = crearControles(document.getElementById("controlesTactiles"));
const estrellas = crearEstrellas(90);

// Límites para un alunizaje seguro (píxeles por segundo / radianes)
const SEGURO = { vy: 45, vx: 28, angulo: 0.28 };

let detenerBucle = null;
let juego = null;

document.getElementById("botonJugar").addEventListener("click", iniciar);
document.getElementById("botonReiniciar").addEventListener("click", iniciar);

function iniciar() {
    if (detenerBucle) detenerBucle();
    pantallaInicio.style.display = "none";
    zonaJuego.classList.add("activa");
    controles.habilitar(true);
    lienzo.scrollIntoView({ behavior: "smooth", block: "center" });
    juego = { nivel: 1, puntos: 0, colores: COHETES[selectorCohete.value] };
    nuevoNivel();
    detenerBucle = iniciarBucle(actualizar);
}

function generarTerreno() {
    const paso = 20;
    const puntos = [];
    let y = ALTO - 90;
    for (let x = 0; x <= ANCHO; x += paso) {
        y += (Math.random() - 0.5) * 50;
        y = Math.max(ALTO - 190, Math.min(ALTO - 25, y));
        puntos.push({ x, y });
    }

    // Plataformas: más estrechas = más puntos
    const tipos = [
        { ancho: 140, mult: 1 },
        { ancho: 100, mult: 2 },
        { ancho: 60, mult: 4 }
    ];
    const plataformas = [];
    const zonas = [[40, 240], [300, 500], [560, 760]].sort(() => Math.random() - 0.5);
    tipos.forEach((t, i) => {
        const [zMin, zMax] = zonas[i];
        const x1 = Math.round((zMin + Math.random() * (zMax - zMin - t.ancho)) / paso) * paso;
        const x2 = x1 + Math.ceil(t.ancho / paso) * paso;
        const altura = puntos[x1 / paso].y;
        for (let k = x1 / paso; k <= x2 / paso && k < puntos.length; k++) puntos[k].y = altura;
        plataformas.push({ x1, x2, y: altura, mult: t.mult });
    });
    return { puntos, plataformas };
}

function nuevoNivel() {
    const n = juego.nivel;
    const terreno = generarTerreno();
    juego.terreno = terreno.puntos;
    juego.plataformas = terreno.plataformas;
    juego.gravedad = 20 + n * 2.5;
    juego.nave = {
        x: 60 + Math.random() * (ANCHO - 120), y: 50,
        vx: (Math.random() - 0.5) * 60, vy: 0,
        angulo: 0, combustible: Math.max(45, 100 - (n - 1) * 8)
    };
    juego.particulas = [];
    juego.estado = "volando"; // volando | aterrizo | destruida
    juego.mensaje = "";
    juego.espera = 0;
}

function alturaTerreno(x) {
    const t = juego.terreno;
    const i = Math.max(0, Math.min(t.length - 2, Math.floor(x / 20)));
    const a = t[i], b = t[i + 1];
    const f = (x - a.x) / (b.x - a.x);
    return a.y + (b.y - a.y) * Math.max(0, Math.min(1, f));
}

function actualizar(dt) {
    const nave = juego.nave;
    dibujarEstrellas(ctx, estrellas, dt, 0.05);

    // Tierra a lo lejos
    ctx.fillStyle = "#1f6fd1";
    ctx.beginPath();
    ctx.arc(680, 80, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2fa85a";
    ctx.beginPath();
    ctx.ellipse(674, 74, 10, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();

    let propulsando = false;

    if (juego.estado === "volando") {
        if (controles.tiene("izq")) nave.angulo -= 2.4 * dt;
        if (controles.tiene("der")) nave.angulo += 2.4 * dt;
        nave.angulo = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, nave.angulo));

        if (controles.tiene("arriba") && nave.combustible > 0) {
            propulsando = true;
            const empuje = 58;
            nave.vx += Math.sin(nave.angulo) * empuje * dt;
            nave.vy -= Math.cos(nave.angulo) * empuje * dt;
            nave.combustible = Math.max(0, nave.combustible - 10 * dt);
        }
        nave.vy += juego.gravedad * dt;
        nave.x += nave.vx * dt;
        nave.y += nave.vy * dt;

        // cruzar el borde lleva al otro lado
        if (nave.x < 0) nave.x += ANCHO;
        if (nave.x > ANCHO) nave.x -= ANCHO;

        const base = nave.y + 16;
        if (base >= alturaTerreno(nave.x)) evaluarContacto();
    } else {
        juego.espera -= dt;
        if (juego.espera <= 0) {
            if (juego.estado === "aterrizo") {
                juego.nivel++;
                nuevoNivel();
            } else if (juego.estado === "destruida") {
                juego.estado = "fin";
                finalizar();
            }
        }
    }

    // Terreno
    ctx.fillStyle = "#6d6d78";
    ctx.beginPath();
    ctx.moveTo(0, ALTO);
    juego.terreno.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(ANCHO, ALTO);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#b9b9c6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    juego.terreno.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();

    // Plataformas
    juego.plataformas.forEach(pl => {
        ctx.fillStyle = "#ff7a00";
        ctx.fillRect(pl.x1, pl.y - 3, pl.x2 - pl.x1, 5);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Oswald, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`x${pl.mult}`, (pl.x1 + pl.x2) / 2, pl.y + 20);
    });

    // Nave
    if (juego.estado !== "destruida" && juego.estado !== "fin") {
        dibujarCohete(ctx, nave.x, nave.y, nave.angulo, juego.colores, 0.85, propulsando);
        // patas de aterrizaje
        ctx.save();
        ctx.translate(nave.x, nave.y);
        ctx.rotate(nave.angulo);
        ctx.strokeStyle = "#cfd6e6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, 10); ctx.lineTo(-12, 16);
        ctx.moveTo(6, 10); ctx.lineTo(12, 16);
        ctx.stroke();
        ctx.restore();
    }

    actualizarParticulas(ctx, juego.particulas, dt);

    if (juego.mensaje) {
        ctx.fillStyle = juego.estado === "aterrizo" ? "#1fbf5a" : "#ff3355";
        ctx.font = "bold 30px Oswald, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(juego.mensaje, ANCHO / 2, ALTO / 2 - 60);
    }

    const ok = (v, lim) => (Math.abs(v) <= lim ? "#1fbf5a" : "#ff3355");
    const altitud = Math.max(0, Math.round(alturaTerreno(nave.x) - nave.y - 16));
    hud.innerHTML = `<span>Nivel: <b>${juego.nivel}</b></span>
        <span>Combustible: <b>${Math.round(nave.combustible)}%</b></span>
        <span>Vel. vertical: <b style="color:${ok(nave.vy, SEGURO.vy)}">${Math.round(nave.vy)}</b></span>
        <span>Vel. horizontal: <b style="color:${ok(nave.vx, SEGURO.vx)}">${Math.round(nave.vx)}</b></span>
        <span>Altitud: <b>${altitud}</b></span>
        <span>Puntos: <b>${juego.puntos}</b></span>`;
}

function evaluarContacto() {
    const nave = juego.nave;
    const plataforma = juego.plataformas.find(pl => nave.x - 10 >= pl.x1 && nave.x + 10 <= pl.x2);
    const suave = Math.abs(nave.vy) <= SEGURO.vy && Math.abs(nave.vx) <= SEGURO.vx && Math.abs(nave.angulo) <= SEGURO.angulo;

    if (plataforma && suave) {
        nave.y = plataforma.y - 16;
        const ganados = Math.round((40 + nave.combustible * 0.6) * plataforma.mult);
        juego.puntos += ganados;
        juego.estado = "aterrizo";
        juego.mensaje = `¡Alunizaje exitoso! +${ganados}`;
        juego.espera = 2;
    } else {
        juego.estado = "destruida";
        juego.mensaje = plataforma ? "¡Bajaste demasiado rápido!" : "¡Te estrellaste fuera de la plataforma!";
        crearExplosion(juego.particulas, nave.x, nave.y, juego.colores.llama, 30);
        crearExplosion(juego.particulas, nave.x, nave.y, "#ffffff", 14);
        juego.espera = 1.6;
    }
}

function finalizar() {
    if (detenerBucle) detenerBucle();
    detenerBucle = null;
    controles.habilitar(false);
    const exitosos = juego.nivel - 1;
    mostrarOverlay("🌙 Misión terminada",
        exitosos > 0 ? `Lograste ${exitosos} alunizaje${exitosos > 1 ? "s" : ""} exitoso${exitosos > 1 ? "s" : ""}.`
                     : "No lograste alunizar. ¡Usa el propulsor con calma!",
        juego.puntos > 0 ? `+${juego.puntos} puntos` : "Sin puntos esta vez");
    guardarPuntaje(juego.puntos);
}

mostrarRanking();
