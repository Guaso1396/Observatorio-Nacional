(function () {
const { guardarPuntaje, mostrarRanking } = window.Ranking;

const { mostrarOverlay } = window.Juegos;

// =========================================================
// Trivia Espacial
// Las preguntas salen de 3 fuentes (ver más abajo cómo se reparten entre partidas):
//   1. Banco de datos curiosos (fijo)
//   2. Generador de comparaciones entre planetas (cientos de combinaciones)
//   3. Datos en vivo de la API de asteroides de la NASA (NeoWs)
// =========================================================

const PREGUNTAS_POR_PARTIDA = 10;
const SEGUNDOS_POR_PREGUNTA = 15;

// ---------- 1. Banco de datos curiosos ----------
// [pregunta, respuesta correcta, [3 incorrectas], dato extra]
const BANCO = [
    ["¿Cuál es el planeta más cercano al Sol?", "Mercurio", ["Venus", "Marte", "Tierra"], "Mercurio completa una vuelta al Sol en solo 88 días."],
    ["¿Cuál es el planeta más grande del sistema solar?", "Júpiter", ["Saturno", "Neptuno", "Urano"], "Su diámetro es unas 11 veces el de la Tierra."],
    ["¿Cuál es el planeta más caliente del sistema solar?", "Venus", ["Mercurio", "Marte", "Júpiter"], "Su densa atmósfera de CO₂ produce un efecto invernadero extremo."],
    ["¿En qué planeta está la Gran Mancha Roja, una tormenta gigante?", "Júpiter", ["Marte", "Saturno", "Neptuno"], "Es una tormenta que se observa desde hace siglos."],
    ["¿Quién fue la primera persona en caminar sobre la Luna?", "Neil Armstrong", ["Buzz Aldrin", "Yuri Gagarin", "Michael Collins"], "Lo hizo el 20 de julio de 1969."],
    ["¿Qué misión llevó a los primeros humanos a la superficie de la Luna?", "Apolo 11", ["Apolo 13", "Géminis 4", "Artemis I"], "La tripulación fue Armstrong, Aldrin y Collins."],
    ["¿En qué año llegó el ser humano a la Luna por primera vez?", "1969", ["1965", "1972", "1957"], "Fue durante la misión Apolo 11."],
    ["¿Quién fue el primer ser humano en viajar al espacio?", "Yuri Gagarin", ["Neil Armstrong", "John Glenn", "Valentina Tereshkova"], "Viajó a bordo de la Vostok 1 en 1961."],
    ["¿Cuál fue el primer satélite artificial puesto en órbita?", "Sputnik 1", ["Explorer 1", "Vanguard 1", "Telstar"], "Fue lanzado por la Unión Soviética en 1957."],
    ["¿Quién fue la primera mujer en viajar al espacio?", "Valentina Tereshkova", ["Sally Ride", "Mae Jemison", "Valentina Gagarina"], "Voló en la Vostok 6 en 1963."],
    ["¿Qué rover de la NASA aterrizó en Marte en febrero de 2021?", "Perseverance", ["Curiosity", "Opportunity", "Sojourner"], "Llevó consigo el helicóptero Ingenuity."],
    ["¿En qué cráter de Marte aterrizó el rover Curiosity?", "Cráter Gale", ["Cráter Jezero", "Valles Marineris", "Olympus Mons"], "Curiosity aterrizó allí en agosto de 2012."],
    ["¿Cómo se llamó el helicóptero que voló en Marte?", "Ingenuity", ["Perseverance", "Dragonfly", "Phoenix"], "Fue el primer vehículo en realizar un vuelo propulsado en otro planeta."],
    ["¿Cuál es el volcán más grande conocido del sistema solar?", "Olympus Mons", ["Monte Everest", "Mauna Kea", "Valles Marineris"], "Está en Marte y mide unos 22 km de altura, cerca de dos veces y media el Everest."],
    ["¿Cómo se llaman las dos lunas de Marte?", "Fobos y Deimos", ["Ío y Europa", "Titán y Rea", "Tritón y Nereida"], "Sus nombres significan 'miedo' y 'terror' en griego."],
    ["¿Cuál es la luna más grande de Saturno?", "Titán", ["Encélado", "Mimas", "Europa"], "Titán tiene una atmósfera densa, algo único entre las lunas."],
    ["¿Cuál es la luna más grande del sistema solar?", "Ganímedes", ["Titán", "La Luna", "Calisto"], "Ganímedes, luna de Júpiter, es más grande que el planeta Mercurio."],
    ["¿Qué planeta gira prácticamente 'acostado' sobre su eje?", "Urano", ["Neptuno", "Venus", "Saturno"], "Su eje está inclinado unos 98 grados."],
    ["¿En qué año Plutón fue reclasificado como planeta enano?", "2006", ["1999", "2010", "1930"], "La decisión la tomó la Unión Astronómica Internacional."],
    ["¿Qué telescopio espacial fue lanzado en diciembre de 2021?", "James Webb", ["Hubble", "Kepler", "Spitzer"], "Observa principalmente en luz infrarroja."],
    ["¿En qué año se lanzó el telescopio espacial Hubble?", "1990", ["1985", "2001", "1977"], "Fue llevado al espacio por el transbordador Discovery."],
    ["¿Cuál es la estrella más cercana a la Tierra?", "El Sol", ["Próxima Centauri", "Sirio", "Betelgeuse"], "Después del Sol, la más cercana es Próxima Centauri."],
    ["Después del Sol, ¿cuál es la estrella más cercana a la Tierra?", "Próxima Centauri", ["Sirio", "Vega", "Polaris"], "Está a unos 4,2 años luz."],
    ["¿Cómo se llama la galaxia en la que vivimos?", "Vía Láctea", ["Andrómeda", "Triángulo", "Sombrero"], "Es una galaxia espiral barrada."],
    ["¿Cuál es la galaxia grande más cercana a la Vía Láctea?", "Andrómeda", ["Sombrero", "Remolino", "Centaurus A"], "Está a unos 2,5 millones de años luz."],
    ["¿Cuánto tarda aproximadamente la luz del Sol en llegar a la Tierra?", "Unos 8 minutos", ["1 segundo", "1 hora", "1 día"], "Recorre unos 150 millones de kilómetros."],
    ["¿Cuál es aproximadamente la velocidad de la luz en el vacío?", "300.000 km/s", ["30.000 km/s", "3.000 km/s", "3.000.000 km/s"], "El valor exacto es 299.792,458 km/s."],
    ["¿Qué es una Unidad Astronómica (UA)?", "La distancia media entre la Tierra y el Sol", ["La distancia entre la Tierra y la Luna", "Un año luz", "El diámetro del Sol"], "Equivale a unos 150 millones de km."],
    ["¿Entre qué planetas está el cinturón principal de asteroides?", "Marte y Júpiter", ["Tierra y Marte", "Júpiter y Saturno", "Venus y la Tierra"], "Contiene millones de rocas de distintos tamaños."],
    ["¿Qué planeta enano se encuentra en el cinturón de asteroides?", "Ceres", ["Plutón", "Eris", "Makemake"], "Fue visitado por la sonda Dawn de la NASA."],
    ["¿En qué año se fundó la NASA?", "1958", ["1945", "1961", "1969"], "Se creó en plena carrera espacial."],
    ["¿Cuál es la agencia espacial de Europa?", "ESA", ["NASA", "JAXA", "Roscosmos"], "JAXA es la de Japón y Roscosmos la de Rusia."],
    ["¿Qué significa la sigla ISS?", "Estación Espacial Internacional", ["Instituto de Satélites Solares", "Sistema Solar Interno", "Sonda Espacial Integrada"], "Orbita la Tierra a unos 400 km de altura."],
    ["¿Cuál es el objeto construido por humanos más lejano de la Tierra?", "Voyager 1", ["Voyager 2", "New Horizons", "Pioneer 10"], "Ya se encuentra en el espacio interestelar."],
    ["¿En qué año se lanzaron las sondas Voyager?", "1977", ["1969", "1986", "1990"], "Ambas siguen enviando datos décadas después."],
    ["¿Qué planeta tiene un día (rotación) más largo que su año?", "Venus", ["Mercurio", "Marte", "Neptuno"], "Venus tarda unos 243 días terrestres en girar sobre sí mismo."],
    ["¿Qué planeta tiene los anillos más visibles y famosos?", "Saturno", ["Júpiter", "Urano", "Neptuno"], "Los cuatro planetas gigantes tienen anillos, pero los de Saturno son los más brillantes."],
    ["¿De qué elemento está compuesto principalmente el Sol?", "Hidrógeno", ["Oxígeno", "Hierro", "Carbono"], "Le sigue el helio."],
    ["¿Qué tipo de estrella es el Sol?", "Enana amarilla", ["Gigante roja", "Enana blanca", "Supergigante azul"], "Es una estrella de tipo espectral G."],
    ["¿Qué luna de Júpiter tendría un océano de agua bajo su corteza de hielo?", "Europa", ["Ío", "Fobos", "Titán"], "Es uno de los lugares donde se busca vida."],
    ["¿Qué luna de Saturno expulsa géiseres de agua al espacio?", "Encélado", ["Titán", "Ganímedes", "Mimas"], "La sonda Cassini los atravesó y analizó."],
    ["¿Cuál es el cuerpo con más actividad volcánica del sistema solar?", "Ío", ["La Tierra", "Venus", "Marte"], "Ío es una luna de Júpiter."],
    ["¿Qué planeta tiene los vientos más rápidos registrados?", "Neptuno", ["Júpiter", "Tierra", "Mercurio"], "Superan los 2.000 km/h."],
    ["¿Qué planeta es tan poco denso que, en teoría, flotaría en el agua?", "Saturno", ["Júpiter", "Urano", "Marte"], "Su densidad media es menor que la del agua."],
    ["¿Qué cohete llevó a los astronautas del programa Apolo a la Luna?", "Saturno V", ["Falcon 9", "Atlas V", "Soyuz"], "Sigue siendo uno de los cohetes más potentes jamás construidos."],
    ["¿Cómo se llama el programa actual de la NASA para volver a la Luna?", "Artemis", ["Apolo", "Géminis", "Mercury"], "En la mitología griega, Artemisa es la hermana gemela de Apolo."],
    ["¿Qué sonda de la NASA sobrevoló Plutón en 2015?", "New Horizons", ["Voyager 2", "Cassini", "Juno"], "Envió las primeras imágenes detalladas de Plutón."],
    ["¿Qué sonda estudió Saturno hasta 2017?", "Cassini", ["Galileo", "Juno", "Magallanes"], "Terminó su misión sumergiéndose en la atmósfera de Saturno."],
    ["¿Qué sonda de la NASA entró en órbita de Júpiter en 2016?", "Juno", ["Cassini", "Voyager 1", "Dawn"], "Fue diseñada para estudiar la atmósfera, el interior y el campo magnético de Júpiter."],
    ["¿En qué mes ocurre la lluvia de estrellas de las Perseidas?", "Agosto", ["Enero", "Abril", "Diciembre"], "Su máximo suele ser alrededor del 12 de agosto."],
    ["¿Cada cuántos años, aproximadamente, se acerca a la Tierra el cometa Halley?", "Unos 76 años", ["Unos 10 años", "Unos 200 años", "Cada año"], "Su última visita fue en 1986."],
    ["¿Qué significa 'NEO' en astronomía?", "Objeto cercano a la Tierra", ["Nueva estrella observada", "Nebulosa extragaláctica", "Órbita externa natural"], "Viene del inglés Near-Earth Object."],
    ["¿Qué ocurre en un eclipse solar?", "La Luna se interpone entre el Sol y la Tierra", ["La Tierra se interpone entre el Sol y la Luna", "El Sol se apaga", "Marte tapa al Sol"], "En un eclipse lunar es la Tierra la que se interpone."],
    ["¿Cuánto dura aproximadamente el ciclo completo de fases de la Luna?", "29,5 días", ["7 días", "365 días", "15 días"], "Se llama mes sinódico."],
    ["La gravedad en la Luna es aproximadamente...", "1/6 de la de la Tierra", ["El doble que la de la Tierra", "Igual que la de la Tierra", "1/100 de la de la Tierra"], "Por eso los astronautas podían dar grandes saltos."],
    ["¿Cómo se llama el agujero negro supermasivo del centro de la Vía Láctea?", "Sagitario A*", ["Cygnus X-1", "M87*", "Andrómeda A"], "Su primera imagen se publicó en 2022."],
    ["¿Qué significa APOD, la sección de la NASA de la página de inicio?", "Imagen astronómica del día", ["Programa de observación de asteroides", "Agencia de planetas", "Archivo de datos orbitales"], "Viene del inglés Astronomy Picture of the Day."],
    ["La cámara EPIC, que toma las fotos de la Tierra completa, va a bordo del satélite...", "DSCOVR", ["Hubble", "ISS", "Landsat"], "Está a 1,5 millones de km de la Tierra, en el punto de Lagrange L1."],
    ["¿Qué misión de la NASA desvió a propósito un asteroide en 2022?", "DART", ["OSIRIS-REx", "Artemis I", "Lucy"], "Impactó contra Dimorfo, luna del asteroide Dídimo."],
    ["¿Qué misión de la NASA trajo a la Tierra muestras del asteroide Bennu?", "OSIRIS-REx", ["DART", "Hayabusa2", "Rosetta"], "La cápsula aterrizó en Utah en septiembre de 2023."],
    ["¿Qué planeta es conocido como el 'planeta rojo'?", "Marte", ["Venus", "Júpiter", "Mercurio"], "Su color se debe al óxido de hierro de su superficie."],
    ["¿Cuál es el único satélite natural de la Tierra?", "La Luna", ["Fobos", "Europa", "Titán"], "Se aleja de la Tierra unos 3,8 cm cada año."],
    ["¿Qué nave espacial tripulada de SpaceX lleva astronautas a la ISS?", "Crew Dragon", ["Starliner", "Orión", "Soyuz"], "Hizo su primer vuelo tripulado en 2020."],
    ["¿Cómo se llama el borde de un agujero negro del que ni la luz puede escapar?", "Horizonte de sucesos", ["Corona", "Cinturón de Kuiper", "Heliopausa"], "Todo lo que cruza ese límite no puede volver."]
];

// ---------- 2. Datos de planetas para el generador ----------
const PLANETAS = [
    { nombre: "Mercurio", orden: 1, diametro: 4879,   periodo: "88 días",    tipo: "Rocoso" },
    { nombre: "Venus",    orden: 2, diametro: 12104,  periodo: "225 días",   tipo: "Rocoso" },
    { nombre: "Tierra",   orden: 3, diametro: 12756,  periodo: "365 días",   tipo: "Rocoso" },
    { nombre: "Marte",    orden: 4, diametro: 6792,   periodo: "687 días",   tipo: "Rocoso" },
    { nombre: "Júpiter",  orden: 5, diametro: 142984, periodo: "11,9 años",  tipo: "Gigante gaseoso" },
    { nombre: "Saturno",  orden: 6, diametro: 120536, periodo: "29,5 años",  tipo: "Gigante gaseoso" },
    { nombre: "Urano",    orden: 7, diametro: 51118,  periodo: "84 años",    tipo: "Gigante de hielo" },
    { nombre: "Neptuno",  orden: 8, diametro: 49528,  periodo: "165 años",   tipo: "Gigante de hielo" }
];
const TIPOS = ["Rocoso", "Gigante gaseoso", "Gigante de hielo", "Planeta enano"];

const COMPARACIONES = [
    { id: "grande",  texto: "¿Cuál de estos planetas es el más grande?",           valor: p => p.diametro, mayor: true },
    { id: "pequeno", texto: "¿Cuál de estos planetas es el más pequeño?",          valor: p => p.diametro, mayor: false },
    { id: "cerca",   texto: "¿Cuál de estos planetas está más cerca del Sol?",     valor: p => p.orden,    mayor: false },
    { id: "lejos",   texto: "¿Cuál de estos planetas está más lejos del Sol?",     valor: p => p.orden,    mayor: true },
    { id: "anolargo", texto: "¿En cuál de estos planetas dura más un año?",        valor: p => p.orden,    mayor: true },
    { id: "anocorto", texto: "¿En cuál de estos planetas dura menos un año?",      valor: p => p.orden,    mayor: false }
];

function mezclar(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function tomarAlAzar(arr, n) { return mezclar(arr).slice(0, n); }

function armar(id, categoria, pregunta, correcta, incorrectas, dato = "") {
    const opciones = mezclar([correcta, ...incorrectas]);
    return { id, categoria, pregunta, opciones, correcta: opciones.indexOf(correcta), dato };
}

function preguntasDelBanco() {
    return BANCO.map(([pregunta, correcta, incorrectas, dato], i) =>
        armar(`b${i}`, "Datos curiosos", pregunta, correcta, incorrectas, dato));
}

function generarPreguntaPlaneta() {
    const tipo = Math.random();
    if (tipo < 0.6) {
        const comp = COMPARACIONES[Math.floor(Math.random() * COMPARACIONES.length)];
        const grupo = tomarAlAzar(PLANETAS, 4);
        const ordenados = [...grupo].sort((a, b) => comp.valor(a) - comp.valor(b));
        const correcta = comp.mayor ? ordenados[3] : ordenados[0];
        const id = `p-${comp.id}-${grupo.map(p => p.orden).sort().join("")}`;
        return armar(id, "Planetas", comp.texto, correcta.nombre,
            grupo.filter(p => p !== correcta).map(p => p.nombre));
    }
    const planeta = PLANETAS[Math.floor(Math.random() * PLANETAS.length)];
    if (tipo < 0.75) {
        const incorrectas = tomarAlAzar([1, 2, 3, 4, 5, 6, 7, 8].filter(n => n !== planeta.orden), 3);
        return armar(`p-orden-${planeta.orden}`, "Planetas",
            `Contando desde el Sol, ¿qué número de planeta es ${planeta.nombre}?`,
            `${planeta.orden}°`, incorrectas.map(n => `${n}°`));
    }
    if (tipo < 0.88) {
        return armar(`p-tipo-${planeta.orden}`, "Planetas",
            `¿Qué tipo de planeta es ${planeta.nombre}?`,
            planeta.tipo, TIPOS.filter(t => t !== planeta.tipo));
    }
    const otros = tomarAlAzar(PLANETAS.filter(p => p !== planeta), 3).map(p => p.periodo);
    return armar(`p-periodo-${planeta.orden}`, "Planetas",
        `¿Cuánto dura aproximadamente un año (una vuelta al Sol) en ${planeta.nombre}?`,
        planeta.periodo, otros);
}

// ---------- 3. Preguntas con datos en vivo de la NASA ----------
async function preguntasNasa() {
    try {
        const hoy = new Date().toISOString().slice(0, 10);
        const lista = await window.Juegos.verAsteroides(hoy);
        if (lista.length < 4) return [];
        const resultado = [];
        // La fecha va escrita en la pregunta para que siga siendo correcta si la pregunta se repite otro día
        const fecha = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

        let grupo = tomarAlAzar(lista, 4);
        let correcto = grupo.reduce((a, b) => (parseFloat(b.diametroMax) > parseFloat(a.diametroMax) ? b : a));
        resultado.push(armar(`n-grande-${hoy}-${grupo.map(a => a.nombre).sort().join()}`, "NASA en vivo",
            `Según la NASA, de estos asteroides que pasaron cerca de la Tierra el ${fecha}, ¿cuál es el más grande?`,
            correcto.nombre, grupo.filter(a => a !== correcto).map(a => a.nombre),
            `${correcto.nombre} mide hasta ${correcto.diametroMax} m de diámetro estimado.`));

        grupo = tomarAlAzar(lista, 4);
        correcto = grupo.reduce((a, b) => (Number(b.distanciaKm) < Number(a.distanciaKm) ? b : a));
        resultado.push(armar(`n-cerca-${hoy}-${grupo.map(a => a.nombre).sort().join()}`, "NASA en vivo",
            `De estos asteroides reportados por la NASA el ${fecha}, ¿cuál pasó más cerca de la Tierra?`,
            correcto.nombre, grupo.filter(a => a !== correcto).map(a => a.nombre),
            `Pasó a unos ${Number(correcto.distanciaKm).toLocaleString("es-CO")} km de la Tierra.`));

        const elegido = lista[Math.floor(Math.random() * lista.length)];
        resultado.push(armar(`n-peligro-${hoy}-${elegido.nombre}`, "NASA en vivo",
            `¿La NASA clasifica al asteroide ${elegido.nombre} (que pasó cerca de la Tierra el ${fecha}) como "potencialmente peligroso"?`,
            elegido.peligroso ? "Sí" : "No", [elegido.peligroso ? "No" : "Sí"],
            "‘Potencialmente peligroso’ depende de su tamaño y de qué tanto se puede acercar su órbita a la de la Tierra."));
        return resultado;
    } catch {
        return [];
    }
}

// =========================================================
// Progreso entre partidas
//  - Partidas 1 a 10: 10 preguntas NUEVAS cada una (100 preguntas distintas).
//  - Desde la partida 11: cada partida toma 1 pregunta de cada una de las
//    partidas 1 a 10, en orden mezclado. En cada bloque de 10 partidas
//    (11-20, 21-30, ...) cada una de las 100 preguntas sale exactamente una vez
//    y las combinaciones cambian en cada bloque.
// =========================================================
const CLAVE_PROGRESO = "trivia_progreso";
const PARTIDAS_NUEVAS = 10;

function progresoVacio() {
    return { partidas: 0, rondas: [], combinaciones: [] };
}

function leerProgreso() {
    try {
        const p = JSON.parse(localStorage.getItem(CLAVE_PROGRESO));
        if (p && Array.isArray(p.rondas) && Array.isArray(p.combinaciones)) return p;
    } catch { /* datos dañados o sin almacenamiento */ }
    return progresoVacio();
}

function guardarProgreso(p) {
    try { localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(p)); }
    catch { /* sin almacenamiento: cada partida será nueva, pero no se puede recordar el historial */ }
}

// Se guarda el texto de la respuesta correcta (no su posición) para volver a mezclar las opciones al repetirla
function paraGuardar(p) {
    return { id: p.id, categoria: p.categoria, pregunta: p.pregunta, opciones: p.opciones, respuesta: p.opciones[p.correcta], dato: p.dato };
}
function desdeGuardada(g) {
    const opciones = mezclar(g.opciones);
    return { id: g.id, categoria: g.categoria, pregunta: g.pregunta, opciones, correcta: opciones.indexOf(g.respuesta), dato: g.dato };
}

/** 10 preguntas nuevas que no estén en `excluir` (ids) ni se repitan entre sí. */
async function preguntasNuevas(excluir) {
    const elegidas = [];
    const usadas = new Set(excluir);
    const textos = new Set();
    const agregar = p => {
        if (elegidas.length >= PREGUNTAS_POR_PARTIDA || usadas.has(p.id) || textos.has(p.pregunta + p.opciones.slice().sort().join())) return;
        usadas.add(p.id);
        textos.add(p.pregunta + p.opciones.slice().sort().join());
        elegidas.push(p);
    };

    // Hasta 2 preguntas con datos reales de la NASA de hoy
    tomarAlAzar(await preguntasNasa(), 2).forEach(agregar);
    // 5 del banco de datos curiosos (64 preguntas: alcanzan para las 10 primeras partidas)
    tomarAlAzar(preguntasDelBanco().filter(p => !usadas.has(p.id)), 5).forEach(agregar);
    // El resto con el generador de planetas (cientos de combinaciones)
    for (let i = 0; i < 2000 && elegidas.length < PREGUNTAS_POR_PARTIDA; i++) agregar(generarPreguntaPlaneta());
    return elegidas;
}

async function armarPartida() {
    const prog = leerProgreso();
    const numero = prog.partidas + 1;
    let preguntas, etiqueta;

    if (prog.rondas.length < PARTIDAS_NUEVAS) {
        const vistas = new Set(prog.rondas.flat().map(q => q.id));
        preguntas = await preguntasNuevas(vistas);
        prog.rondas.push(preguntas.map(paraGuardar));
        etiqueta = `Partida ${numero} · preguntas nuevas (${prog.rondas.length} de ${PARTIDAS_NUEVAS})`;
    } else {
        if (prog.combinaciones.length === 0) {
            // Nuevo bloque de 10 partidas: para cada partida original se baraja el orden de sus preguntas,
            // así la combinación k toma la pregunta k-ésima (barajada) de cada una.
            const ordenes = prog.rondas.map(r => mezclar(r.map((_, i) => i)));
            prog.combinaciones = Array.from({ length: PREGUNTAS_POR_PARTIDA }, (_, k) => ordenes.map(o => o[k]));
        }
        const combinacion = prog.combinaciones.shift(); // combinacion[j] = pregunta tomada de la partida j+1
        preguntas = combinacion.map((indice, j) => desdeGuardada(prog.rondas[j][indice]));
        etiqueta = `Partida ${numero} · repaso: una pregunta de cada una de tus 10 primeras partidas`;
    }

    prog.partidas = numero;
    guardarProgreso(prog);
    return { preguntas: mezclar(preguntas), etiqueta };
}

// ---------- Juego ----------
const pantallaInicio = document.getElementById("pantallaSeleccion");
const zonaJuego = document.getElementById("zonaJuego");
const hud = document.getElementById("hud");
const textoCategoria = document.getElementById("triviaCategoria");
const textoPregunta = document.getElementById("triviaPregunta");
const contOpciones = document.getElementById("triviaOpciones");
const barraTiempo = document.getElementById("triviaTiempo");
const textoDato = document.getElementById("triviaDato");
const botonJugar = document.getElementById("botonJugar");

let estado = null;
let preparando = false;

botonJugar.addEventListener("click", iniciar);
document.getElementById("botonReiniciar").addEventListener("click", iniciar);

async function iniciar() {
    if (preparando) return; // evita dos partidas a la vez por clics repetidos
    preparando = true;
    if (estado?.temporizador) clearInterval(estado.temporizador);
    if (estado) estado.cancelada = true;
    botonJugar.disabled = true;
    botonJugar.textContent = "Preparando preguntas...";
    const { preguntas, etiqueta } = await armarPartida();
    botonJugar.disabled = false;
    botonJugar.textContent = "Jugar";
    preparando = false;

    pantallaInicio.style.display = "none";
    zonaJuego.classList.add("activa");
    estado = { preguntas, etiqueta, indice: 0, aciertos: 0, puntos: 0, temporizador: null };
    mostrarPregunta();
}

function actualizarHud() {
    hud.innerHTML = `<span>Pregunta: <b>${Math.min(estado.indice + 1, PREGUNTAS_POR_PARTIDA)} / ${PREGUNTAS_POR_PARTIDA}</b></span>
        <span>Aciertos: <b>${estado.aciertos}</b></span>
        <span>Puntos: <b>${estado.puntos}</b></span>
        <span style="flex-basis:100%;font-size:13px;color:#aaa">${estado.etiqueta}</span>`;
}

function mostrarPregunta() {
    const p = estado.preguntas[estado.indice];
    actualizarHud();
    textoCategoria.textContent = p.categoria;
    textoPregunta.textContent = p.pregunta;
    textoDato.textContent = "";
    contOpciones.innerHTML = "";

    p.opciones.forEach((opcion, i) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = opcion;
        boton.addEventListener("click", () => responder(i));
        contOpciones.appendChild(boton);
    });

    const inicio = Date.now();
    estado.restante = SEGUNDOS_POR_PREGUNTA;
    barraTiempo.style.width = "100%";
    estado.temporizador = setInterval(() => {
        estado.restante = SEGUNDOS_POR_PREGUNTA - (Date.now() - inicio) / 1000;
        barraTiempo.style.width = `${Math.max(0, estado.restante / SEGUNDOS_POR_PREGUNTA * 100)}%`;
        if (estado.restante <= 0) responder(-1);
    }, 100);
}

function responder(elegida) {
    clearInterval(estado.temporizador);
    estado.temporizador = null;
    const p = estado.preguntas[estado.indice];
    const botones = contOpciones.querySelectorAll("button");
    botones.forEach(b => (b.disabled = true));
    botones[p.correcta].classList.add("correcta");

    if (elegida === p.correcta) {
        estado.aciertos++;
        // 10 puntos por acierto + hasta 5 de bono por responder rápido
        const ganados = 10 + Math.ceil(Math.max(0, estado.restante) / 3);
        estado.puntos += ganados;
        textoDato.textContent = `✅ ¡Correcto! +${ganados}. ${p.dato}`;
    } else {
        if (elegida >= 0) botones[elegida].classList.add("incorrecta");
        textoDato.textContent = `${elegida < 0 ? "⏰ Se acabó el tiempo." : "❌ Incorrecto."} ${p.dato}`;
    }
    actualizarHud();

    const actual = estado;
    setTimeout(() => {
        if (actual.cancelada) return; // se reinició la partida mientras se mostraba la respuesta
        estado.indice++;
        if (estado.indice < estado.preguntas.length) mostrarPregunta();
        else finalizar();
    }, p.dato ? 2600 : 1600);
}

function finalizar() {
    actualizarHud();
    mostrarOverlay("🧠 Trivia terminada",
        `Acertaste ${estado.aciertos} de ${PREGUNTAS_POR_PARTIDA} preguntas.`,
        estado.puntos > 0 ? `+${estado.puntos} puntos` : "Sin puntos esta vez");
    guardarPuntaje(estado.puntos);
}

mostrarRanking();

})();
