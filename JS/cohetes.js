import { guardarPuntaje, mostrarRanking } from "./ranking.js";
import {
    ANCHO, ALTO, COHETES, crearControles, iniciarBucle, crearEstrellas, dibujarEstrellas,
    dibujarCohete, crearFormaAsteroide, dibujarAsteroide, crearExplosion, actualizarParticulas,
    distancia, mostrarOverlay
} from "./juegos-comun.js";

const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const hud = document.getElementById("hud");
const ayuda = document.getElementById("ayudaJuego");
const pantallaSeleccion = document.getElementById("pantallaSeleccion");
const zonaJuego = document.getElementById("zonaJuego");
const selectorCohete = document.getElementById("selectorCohete");
const selectorDificultad = document.getElementById("selectorDificultad");
const botonTactilDisparo = document.getElementById("botonTactilDisparo");

const controles = crearControles(document.getElementById("controlesTactiles"));
const estrellas = crearEstrellas();

const DIFICULTADES = {
    facil:   { mult: 1,   vidaEnemigo: 1, cadencia: [1.8, 3.0], velBala: 200, velEnemigo: 90,  velRivales: [255, 290] },
    normal:  { mult: 1.5, vidaEnemigo: 2, cadencia: [1.2, 2.2], velBala: 250, velEnemigo: 120, velRivales: [290, 330] },
    dificil: { mult: 2,   vidaEnemigo: 3, cadencia: [0.8, 1.6], velBala: 300, velEnemigo: 150, velRivales: [325, 370] }
};

let modo = "guerra";
let detenerBucle = null;

// ---------- Selección de modo ----------
document.querySelectorAll(".tarjeta-modo").forEach(tarjeta => {
    tarjeta.addEventListener("click", () => {
        document.querySelectorAll(".tarjeta-modo").forEach(t => t.classList.remove("seleccionada"));
        tarjeta.classList.add("seleccionada");
        modo = tarjeta.dataset.modo;
    });
});

document.getElementById("botonJugar").addEventListener("click", iniciarPartida);
document.getElementById("botonReiniciar").addEventListener("click", iniciarPartida);
document.getElementById("botonVolver").addEventListener("click", () => {
    terminarBucle();
    zonaJuego.classList.remove("activa");
    pantallaSeleccion.style.display = "";
});

function terminarBucle() {
    if (detenerBucle) detenerBucle();
    detenerBucle = null;
    controles.habilitar(false);
}

function iniciarPartida() {
    terminarBucle();
    pantallaSeleccion.style.display = "none";
    zonaJuego.classList.add("activa");
    const colores = COHETES[selectorCohete.value];
    const dif = DIFICULTADES[selectorDificultad.value];
    controles.habilitar(true);
    lienzo.scrollIntoView({ behavior: "smooth", block: "center" });

    if (modo === "guerra") {
        botonTactilDisparo.style.display = "";
        ayuda.textContent = "Muévete con las flechas o WASD. Dispara con ESPACIO.";
        detenerBucle = iniciarBucle(crearGuerra(colores, dif));
    } else {
        botonTactilDisparo.style.display = "none";
        ayuda.textContent = "← → para moverte, ↑ para acelerar, ↓ para frenar. Esquiva los asteroides y recoge estrellas ⭐ para tener turbo.";
        detenerBucle = iniciarBucle(crearCarrera(colores, dif));
    }
}

function finalizar(titulo, mensaje, puntos) {
    terminarBucle();
    mostrarOverlay(titulo, mensaje, puntos > 0 ? `+${puntos} puntos` : "Sin puntos esta vez");
    guardarPuntaje(puntos);
}

function aleatorio(min, max) { return min + Math.random() * (max - min); }

// =====================================================================
//  MODO 1: GUERRA DE COHETES
// =====================================================================
function crearGuerra(colores, dif) {
    const coloresEnemigos = Object.values(COHETES).filter(c => c !== colores);
    const jugador = { x: ANCHO / 2, y: ALTO - 60, vidas: 3, invulnerable: 0, recarga: 0 };
    const balas = [];          // del jugador
    const balasEnemigas = [];
    const enemigos = [];
    const premios = [];
    const particulas = [];
    let oleada = 0;
    let puntos = 0;
    let derribados = 0;
    let pausaOleada = 1.2;
    let terminado = false;

    function nuevaOleada() {
        oleada++;
        const cantidad = Math.min(1 + oleada, 8);
        for (let i = 0; i < cantidad; i++) {
            enemigos.push({
                x: aleatorio(60, ANCHO - 60),
                y: -40 - i * 30,
                destinoX: aleatorio(60, ANCHO - 60),
                destinoY: aleatorio(50, ALTO * 0.4),
                vida: dif.vidaEnemigo + Math.floor(oleada / 4),
                vidaMax: dif.vidaEnemigo + Math.floor(oleada / 4),
                cooldown: aleatorio(...dif.cadencia) + 0.8,
                colores: coloresEnemigos[i % coloresEnemigos.length],
                golpe: 0
            });
        }
    }

    function dañarJugador() {
        if (jugador.invulnerable > 0) return;
        jugador.vidas--;
        jugador.invulnerable = 1.5;
        crearExplosion(particulas, jugador.x, jugador.y, colores.detalle, 24);
        if (jugador.vidas <= 0) {
            terminado = true;
            const total = Math.round(puntos * dif.mult);
            setTimeout(() => finalizar("💥 ¡Cohete destruido!",
                `Llegaste a la oleada ${oleada} y derribaste ${derribados} cohetes enemigos.`, total), 700);
        }
    }

    return function actualizar(dt) {
        dibujarEstrellas(ctx, estrellas, dt, 2);

        // --- Jugador ---
        if (!terminado) {
            const vel = 320;
            if (controles.tiene("izq")) jugador.x -= vel * dt;
            if (controles.tiene("der")) jugador.x += vel * dt;
            if (controles.tiene("arriba")) jugador.y -= vel * dt;
            if (controles.tiene("abajo")) jugador.y += vel * dt;
            jugador.x = Math.max(20, Math.min(ANCHO - 20, jugador.x));
            jugador.y = Math.max(ALTO * 0.45, Math.min(ALTO - 25, jugador.y));

            jugador.recarga -= dt;
            if (controles.tiene("disparo") && jugador.recarga <= 0) {
                balas.push({ x: jugador.x, y: jugador.y - 22 });
                jugador.recarga = 0.22;
            }
            jugador.invulnerable -= dt;
        }

        // --- Oleadas ---
        if (enemigos.length === 0 && !terminado) {
            pausaOleada -= dt;
            if (pausaOleada <= 0) {
                if (oleada > 0) puntos += 15 * oleada; // bono por oleada superada
                nuevaOleada();
                pausaOleada = 1.5;
            } else if (oleada > 0) {
                ctx.fillStyle = "#ff7a00";
                ctx.font = "bold 30px Oswald, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(`¡Oleada ${oleada} superada!`, ANCHO / 2, ALTO / 2);
            }
        }

        // --- Balas del jugador ---
        ctx.fillStyle = colores.llama;
        for (let i = balas.length - 1; i >= 0; i--) {
            const b = balas[i];
            b.y -= 560 * dt;
            if (b.y < -10) { balas.splice(i, 1); continue; }
            ctx.fillRect(b.x - 2, b.y - 8, 4, 14);

            for (const e of enemigos) {
                if (Math.abs(b.x - e.x) < 16 && Math.abs(b.y - e.y) < 20) {
                    e.vida--;
                    e.golpe = 0.1;
                    balas.splice(i, 1);
                    break;
                }
            }
        }

        // --- Enemigos ---
        for (let i = enemigos.length - 1; i >= 0; i--) {
            const e = enemigos[i];
            if (e.vida <= 0) {
                crearExplosion(particulas, e.x, e.y, e.colores.detalle);
                puntos += 10;
                derribados++;
                if (Math.random() < 0.12) premios.push({ x: e.x, y: e.y });
                enemigos.splice(i, 1);
                continue;
            }
            const dx = e.destinoX - e.x, dy = e.destinoY - e.y;
            const d = Math.hypot(dx, dy);
            if (d < 8) {
                e.destinoX = aleatorio(40, ANCHO - 40);
                e.destinoY = aleatorio(40, ALTO * 0.45);
            } else {
                e.x += (dx / d) * dif.velEnemigo * dt;
                e.y += (dy / d) * dif.velEnemigo * dt;
            }

            e.cooldown -= dt;
            if (e.cooldown <= 0 && !terminado && e.y > 0) {
                const ang = Math.atan2(jugador.y - e.y, jugador.x - e.x);
                balasEnemigas.push({ x: e.x, y: e.y + 20, vx: Math.cos(ang) * dif.velBala, vy: Math.sin(ang) * dif.velBala });
                e.cooldown = aleatorio(...dif.cadencia);
            }

            e.golpe -= dt;
            if (e.golpe > 0) ctx.globalAlpha = 0.5;
            dibujarCohete(ctx, e.x, e.y, Math.PI, e.colores, 1, true);
            ctx.globalAlpha = 1;

            // barra de vida
            if (e.vidaMax > 1) {
                ctx.fillStyle = "rgba(255,255,255,0.2)";
                ctx.fillRect(e.x - 15, e.y - 30, 30, 4);
                ctx.fillStyle = "#1fbf5a";
                ctx.fillRect(e.x - 15, e.y - 30, 30 * (e.vida / e.vidaMax), 4);
            }

            // choque directo
            if (!terminado && distancia(e, jugador) < 30) {
                e.vida = 0;
                dañarJugador();
            }
        }

        // --- Balas enemigas ---
        ctx.fillStyle = "#ff3355";
        for (let i = balasEnemigas.length - 1; i >= 0; i--) {
            const b = balasEnemigas[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < -10 || b.x > ANCHO + 10 || b.y < -10 || b.y > ALTO + 10) { balasEnemigas.splice(i, 1); continue; }
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
            if (!terminado && Math.abs(b.x - jugador.x) < 12 && Math.abs(b.y - jugador.y) < 18) {
                balasEnemigas.splice(i, 1);
                dañarJugador();
            }
        }

        // --- Premios (+1 vida) ---
        for (let i = premios.length - 1; i >= 0; i--) {
            const p = premios[i];
            p.y += 90 * dt;
            if (p.y > ALTO + 20) { premios.splice(i, 1); continue; }
            ctx.font = "22px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("❤️", p.x, p.y);
            if (!terminado && distancia(p, jugador) < 28) {
                jugador.vidas = Math.min(jugador.vidas + 1, 5);
                premios.splice(i, 1);
            }
        }

        // --- Dibujo del jugador ---
        if (!terminado) {
            const parpadeo = jugador.invulnerable > 0 && Math.floor(jugador.invulnerable * 10) % 2 === 0;
            if (!parpadeo) dibujarCohete(ctx, jugador.x, jugador.y, 0, colores, 1.1, true);
        }

        actualizarParticulas(ctx, particulas, dt);

        hud.innerHTML = `<span>Oleada: <b>${oleada}</b></span>
            <span>Vidas: <b>${"❤️".repeat(Math.max(jugador.vidas, 0)) || "—"}</b></span>
            <span>Derribados: <b>${derribados}</b></span>
            <span>Puntos: <b>${Math.round(puntos * dif.mult)}</b></span>`;
    };
}

// =====================================================================
//  MODO 2: CARRERA DE COHETES
// =====================================================================
function crearCarrera(colores, dif) {
    const META = 9000;
    const Y_JUGADOR = ALTO - 110;
    const PREMIOS_POSICION = [150, 100, 60, 30];
    const coloresRivales = Object.values(COHETES).filter(c => c !== colores);
    const nombresRivales = ["Apolo", "Vostok", "Artemis"];

    const corredores = [
        { nombre: "Tú", jugador: true, x: ANCHO / 2, dist: 0, vel: 0, aturdido: 0, turbo: 0, colores, terminado: false }
    ];
    for (let i = 0; i < 3; i++) {
        corredores.push({
            nombre: nombresRivales[i], jugador: false,
            x: [ANCHO * 0.2, ANCHO * 0.8, ANCHO * 0.35][i],
            dist: 0, vel: 0, aturdido: 0, turbo: 0, terminado: false,
            colores: coloresRivales[i],
            velObjetivo: aleatorio(...dif.velRivales),
            cambioRitmo: aleatorio(1, 3)
        });
    }
    const jugador = corredores[0];

    const asteroides = [];
    for (let d = 700; d < META - 200; d += aleatorio(70, 140)) {
        const r = aleatorio(16, 34);
        asteroides.push({
            x: aleatorio(30, ANCHO - 30), dist: d, r,
            vx: Math.random() < 0.3 ? aleatorio(-60, 60) : 0,
            forma: crearFormaAsteroide(r), rot: Math.random() * 6, vrot: aleatorio(-1, 1)
        });
    }
    const estrellasTurbo = [];
    for (let d = 1000; d < META - 300; d += aleatorio(450, 750)) {
        estrellasTurbo.push({ x: aleatorio(50, ANCHO - 50), dist: d, tomada: false });
    }

    const particulas = [];
    let cuentaAtras = 3.5;
    let tiempo = 0;
    let llegados = 0;
    let terminada = false;

    const aPantalla = dist => Y_JUGADOR - (dist - jugador.dist);

    function chocar(c) {
        c.vel *= 0.3;
        c.aturdido = 0.7;
        crearExplosion(particulas, c.x, aPantalla(c.dist), "#c9b29b", 10);
    }

    function posicionDe(c) {
        if (c.terminado) return c.puesto;
        return llegados + corredores.filter(o => !o.terminado && o.dist > c.dist).length + 1;
    }

    return function actualizar(dt) {
        const enMarcha = cuentaAtras <= 0;
        if (!enMarcha) cuentaAtras -= dt;
        else if (!terminada) tiempo += dt;

        // fondo que se desplaza según la velocidad del jugador
        dibujarEstrellas(ctx, estrellas, dt, 0.5 + jugador.vel / 120);

        // bordes de la pista
        ctx.strokeStyle = "rgba(247,42,5,0.35)";
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -(jugador.dist % 40);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 0); ctx.lineTo(8, ALTO);
        ctx.moveTo(ANCHO - 8, 0); ctx.lineTo(ANCHO - 8, ALTO);
        ctx.stroke();
        ctx.setLineDash([]);

        // línea de meta (cuadros)
        const yMeta = aPantalla(META);
        if (yMeta > -30 && yMeta < ALTO + 30) {
            for (let i = 0; i < ANCHO / 20; i++) {
                for (let j = 0; j < 2; j++) {
                    ctx.fillStyle = (i + j) % 2 === 0 ? "#ffffff" : "#111111";
                    ctx.fillRect(i * 20, yMeta - 20 + j * 10, 20, 10);
                }
            }
        }

        // --- Corredores ---
        corredores.forEach(c => {
            if (!enMarcha) return;
            c.aturdido -= dt;
            c.turbo -= dt;

            let velObjetivo;
            if (c.terminado) {
                velObjetivo = 120;
            } else if (c.jugador) {
                velObjetivo = controles.tiene("arriba") ? 420 : controles.tiene("abajo") ? 150 : 300;
                const lateral = 300;
                if (controles.tiene("izq")) c.x -= lateral * dt;
                if (controles.tiene("der")) c.x += lateral * dt;
            } else {
                c.cambioRitmo -= dt;
                if (c.cambioRitmo <= 0) {
                    c.velObjetivo = aleatorio(...dif.velRivales);
                    c.cambioRitmo = aleatorio(1.5, 3.5);
                }
                velObjetivo = c.velObjetivo;
                // IA sencilla: esquiva el asteroide más próximo que tenga delante
                const peligro = asteroides.find(a => a.dist > c.dist && a.dist - c.dist < 260 && Math.abs(a.x - c.x) < a.r + 24);
                if (peligro) c.x += (c.x < peligro.x ? -1 : 1) * 260 * dt;
                // a veces busca la estrella de turbo más cercana
                const estrella = estrellasTurbo.find(s => !s.tomada && s.dist > c.dist && s.dist - c.dist < 300);
                if (estrella && !peligro) c.x += Math.sign(estrella.x - c.x) * 120 * dt;
            }
            if (c.turbo > 0) velObjetivo += 200;
            if (c.aturdido > 0) velObjetivo = Math.min(velObjetivo, 120);

            c.vel += (velObjetivo - c.vel) * Math.min(1, dt * 2.5);
            c.dist += c.vel * dt;
            c.x = Math.max(24, Math.min(ANCHO - 24, c.x));

            if (!c.terminado && c.dist >= META) {
                c.terminado = true;
                llegados++;
                c.puesto = llegados;
                if (c.jugador && !terminada) {
                    terminada = true;
                    const puntos = Math.round(PREMIOS_POSICION[c.puesto - 1] * dif.mult);
                    const medalla = ["🥇", "🥈", "🥉", "🏅"][c.puesto - 1];
                    setTimeout(() => finalizar(`${medalla} ¡Puesto ${c.puesto}!`,
                        `Terminaste la carrera en ${tiempo.toFixed(1)} segundos.`, puntos), 900);
                }
            }
        });

        // --- Asteroides ---
        asteroides.forEach(a => {
            if (enMarcha) {
                a.x += a.vx * dt;
                if (a.x < 20 || a.x > ANCHO - 20) a.vx *= -1;
                a.rot += a.vrot * dt;
            }
            const y = aPantalla(a.dist);
            if (y > -50 && y < ALTO + 50) dibujarAsteroide(ctx, a.x, y, a.forma, a.rot);
            corredores.forEach(c => {
                if (c.aturdido > 0 || c.terminado) return;
                if (Math.abs(c.dist - a.dist) < a.r + 14 && Math.abs(c.x - a.x) < a.r + 10) chocar(c);
            });
        });

        // --- Estrellas de turbo ---
        estrellasTurbo.forEach(s => {
            if (s.tomada) return;
            const y = aPantalla(s.dist);
            if (y > -30 && y < ALTO + 30) {
                ctx.font = "26px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("⭐", s.x, y + 9);
            }
            corredores.forEach(c => {
                if (!s.tomada && Math.abs(c.dist - s.dist) < 26 && Math.abs(c.x - s.x) < 28) {
                    s.tomada = true;
                    c.turbo = 1.8;
                }
            });
        });

        // --- Dibujo de los cohetes ---
        corredores.forEach(c => {
            const y = aPantalla(c.dist);
            const parpadeo = c.aturdido > 0 && Math.floor(c.aturdido * 12) % 2 === 0;
            if (y > -40 && y < ALTO + 40) {
                if (!parpadeo) dibujarCohete(ctx, c.x, y, 0, c.colores, c.jugador ? 1.15 : 1, enMarcha);
                if (c.turbo > 0) {
                    ctx.strokeStyle = c.colores.llama;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(c.x, y, 26, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.fillStyle = c.jugador ? "#ff7a00" : "#cccccc";
                ctx.font = "bold 12px Roboto, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(c.nombre, c.x, y + 36);
            } else {
                // indicador del rival fuera de pantalla
                const arriba = y < 0;
                ctx.fillStyle = c.colores.detalle;
                ctx.font = "bold 12px Roboto, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(`${arriba ? "▲" : "▼"} ${c.nombre}`, c.x, arriba ? 16 : ALTO - 8);
            }
        });

        actualizarParticulas(ctx, particulas, dt);

        // --- Barra de progreso lateral ---
        const xBarra = ANCHO - 22, yIni = 30, alto = ALTO - 60;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(xBarra - 2, yIni, 4, alto);
        corredores.forEach(c => {
            const p = Math.min(c.dist / META, 1);
            ctx.fillStyle = c.jugador ? "#ff7a00" : c.colores.detalle;
            ctx.beginPath();
            ctx.arc(xBarra, yIni + alto * (1 - p), c.jugador ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // --- Cuenta regresiva ---
        if (!enMarcha) {
            ctx.fillStyle = "#ff7a00";
            ctx.font = "bold 80px Oswald, sans-serif";
            ctx.textAlign = "center";
            const n = Math.ceil(cuentaAtras - 0.5);
            ctx.fillText(n > 0 ? n : "¡YA!", ANCHO / 2, ALTO / 2);
        }

        hud.innerHTML = `<span>Posición: <b>${posicionDe(jugador)}° de 4</b></span>
            <span>Velocidad: <b>${Math.round(jugador.vel * 3)} km/h</b></span>
            <span>Progreso: <b>${Math.min(100, Math.floor(jugador.dist / META * 100))}%</b></span>
            <span>Tiempo: <b>${tiempo.toFixed(1)} s</b></span>`;
    };
}

mostrarRanking();
