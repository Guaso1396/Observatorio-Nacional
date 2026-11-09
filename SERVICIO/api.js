// Script clásico (no módulo) para que funcione también al abrir la página con doble clic
class ServiciosNasa {

    constructor() {
        this.datos;
        this.API_KEY = 'ls42GTOyJCrx4nmx9cmxEJDsJWycYlW6UNh90kWa';
        this.ASTEROIDES = 'https://api.nasa.gov/neo/rest/v1/feed';
        this.MARTE = 'https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos';
        this.TIERRA = 'https://epic.gsfc.nasa.gov/api/natural/date';
        this.BIBLIOTECA = 'https://images-api.nasa.gov/search';
    }

    // Asteroides
    async verAsteroides(fechaInicio, fechaFin) {
        try {
            const url = `${this.ASTEROIDES}?start_date=${fechaInicio}&end_date=${fechaFin}&api_key=${this.API_KEY}`;
            const respuesta = await fetch(url);
            if (respuesta.status === 200) {
                this.datos = await respuesta.json();
                let asteroides = [];
                Object.values(this.datos.near_earth_objects).forEach(fechaArray => {
                    fechaArray.forEach(obj => {
                        const ca = obj.close_approach_data[0];
                        asteroides.push({
                            nombre: obj.name,
                            magnitud: obj.absolute_magnitude_h,
                            diametroMin: obj.estimated_diameter.meters.estimated_diameter_min.toFixed(2),
                            diametroMax: obj.estimated_diameter.meters.estimated_diameter_max.toFixed(2),
                            peligroso: obj.is_potentially_hazardous_asteroid,
                            fechaAcercamiento: ca.close_approach_date_full,
                            distanciaKm: parseFloat(ca.miss_distance.kilometers).toFixed(0),
                            velocidadKph: parseFloat(ca.relative_velocity.kilometers_per_hour).toFixed(0)
                        });
                    });
                });
                return asteroides;
            } else {
                throw new Error(`Error ${respuesta.status}`);
            }
        } catch (error) {
            console.error("Error en verAsteroides:", error);
            throw error;
        }
    }

    // Fotos de Marte (API oficial de NASA)
    async verMarte(sol = 1000) {
        try {
            const url = `${this.MARTE}?sol=${sol}&api_key=${this.API_KEY}`;
            const respuesta = await fetch(url);

            if (respuesta.status === 200) {
                this.datos = await respuesta.json();
                if (!this.datos.photos || this.datos.photos.length === 0) {
                    return [];
                }
                return this.datos.photos.map(foto => ({
                    id: foto.id,
                    fecha: foto.earth_date,
                    camara: foto.camera.full_name,
                    url: foto.img_src
                }));
            } else {
                throw new Error(`Error ${respuesta.status}`);
            }
        } catch (error) {
            console.error("API de Marte (NASA) falló:", error.message);
            throw new Error("No se pudo conectar con la API de fotos de Marte de NASA.");
        }
    }
    
    // Imágenes de la Tierra
    async verTierra(fecha) {
        try {
            const url = `${this.TIERRA}/${fecha}`;
            console.log("URL solicitada:", url);

            const respuesta = await fetch(url);
            console.log("Status de respuesta:", respuesta.status);

            if (respuesta.status === 200) {
                this.datos = await respuesta.json();
                console.log("Datos recibidos:", this.datos);

                if (!this.datos || this.datos.length === 0) {
                    return [];
                }

                return this.datos.map(img => {
                    const fechaImg = img.date.split(" ")[0];
                    const fechaFormatted = fechaImg.replace(/-/g, "/");

                    return {
                        nombre: img.image,
                        fecha: img.date,
                        caption: img.caption || "Sin descripción",
                        url: `https://epic.gsfc.nasa.gov/archive/natural/${fechaFormatted}/png/${img.image}.png`
                    };
                });
            } else {
                console.error("Error al obtener imágenes de la Tierra", respuesta.status);
                return [];
            }
        } catch (error) {
            console.error("Error en verTierra:", error);
            throw error;
        }
    }

    // Biblioteca NASA 
    async verBiblioteca(query) {
        try {
            const url = `${this.BIBLIOTECA}?q=${query}&media_type=image,video`;
            const respuesta = await fetch(url);

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }

            const data = await respuesta.json();
            const items = data.collection.items;

            if (!items || items.length === 0) {
                return [];
            }

            return items.map(item => {
                const titulo = item.data[0].title || "Sin título";
                const descripcion = item.data[0].description || "Sin descripción";
                const mediaType = item.data[0].media_type;

                if (mediaType === "image") {
                    const imgUrl = item.links ? item.links[0].href : "";
                    return {
                        tipo: "imagen",
                        titulo,
                        descripcion,
                        url: imgUrl
                    };
                }

                if (mediaType === "video") {
                    const preview = item.links ? item.links[0].href : "";
                    // Construir URL del .mp4 desde item.href (collection.json → ~orig.mp4)
                    const baseUrl = item.href.replace("collection.json", "");
                    const nombreCarpeta = baseUrl.split("/").filter(Boolean).pop();
                    const mp4Url = `${baseUrl}${nombreCarpeta}~orig.mp4`;
                    
                    return {
                        tipo: "video",
                        titulo,
                        descripcion,
                        url: mp4Url,
                        preview
                    };
                }

                return null;
            }).filter(e => e !== null);

        } catch (error) {
            console.error("Error en verBiblioteca:", error);
            throw error;
        }
    }
}

// =====================================================================
// RESPALDO LOCAL
// Si la API de la NASA no responde, se usan los datos guardados en RESPALDO/
// (datos reales descargados con herramientas/descargar_respaldo.py).
// Los resultados de respaldo llevan la propiedad .respaldo para mostrar un aviso.
// =====================================================================
const RUTA_RESPALDO = (() => {
    const src = document.currentScript && document.currentScript.src;
    return src ? new URL("../RESPALDO/", src).href : "../RESPALDO/";
})();

function cargarRespaldo(nombre) {
    window.RESPALDO = window.RESPALDO || {};
    if (window.RESPALDO[nombre]) return Promise.resolve(window.RESPALDO[nombre]);
    // Se carga como <script> (datos.js) para que funcione también al abrir con doble clic
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${RUTA_RESPALDO}${nombre}/datos.js`;
        script.onload = () => (window.RESPALDO[nombre] ? resolve(window.RESPALDO[nombre]) : reject(new Error("Respaldo vacío")));
        script.onerror = () => reject(new Error(`No existe el respaldo de ${nombre}`));
        document.head.appendChild(script);
    });
}

const rutaLocal = ruta => RUTA_RESPALDO + ruta;
const diasDesdeEpoca = fecha => Date.parse(`${fecha}T00:00:00Z`) / 86400000;

/** Devuelve la clave más cercana al valor pedido (fechas AAAA-MM-DD o números de sol). */
function claveMasCercana(claves, objetivo, aNumero) {
    const meta = aNumero(objetivo);
    return claves.reduce((mejor, c) => (Math.abs(aNumero(c) - meta) < Math.abs(aNumero(mejor) - meta) ? c : mejor));
}

function marcar(lista, info) {
    lista.respaldo = info;
    return lista;
}

class ServiciosConRespaldo extends ServiciosNasa {

    async verTierra(fecha) {
        let error = null;
        try {
            const r = await super.verTierra(fecha);
            if (r && r.length) return r;
        } catch (e) { error = e; }

        let datos;
        try { datos = await cargarRespaldo("tierra"); } catch { if (error) throw error; return []; }
        const claves = Object.keys(datos.fechas || {});
        if (!claves.length) { if (error) throw error; return []; }
        const clave = datos.fechas[fecha] ? fecha : claveMasCercana(claves, fecha, diasDesdeEpoca);

        return marcar(datos.fechas[clave].map(i => ({
            nombre: i.image || i.titulo || i.nasa_id,
            fecha: i.date || i.fecha,
            caption: i.caption || i.descripcion || "",
            url: rutaLocal(i.imagen_local)
        })), { api: "Tierra", motivo: error ? "La API de la NASA no respondió" : "La NASA no devolvió imágenes para esa fecha",
               generado: datos.generado, pedido: `fecha ${fecha}`, mostrado: `fecha ${clave}` });
    }

    async verMarte(sol = 1000) {
        let error = null;
        try {
            const r = await super.verMarte(sol);
            if (r && r.length) return r;
        } catch (e) { error = e; }

        // Alternativa en vivo: feed oficial de imágenes crudas de Curiosity en mars.nasa.gov
        // (la API mars-photos de api.nasa.gov fue retirada y responde 404)
        try {
            const respuesta = await fetch(`https://mars.nasa.gov/rss/api/?feed=raw_images&category=msl&feedtype=json&sol=${sol}`);
            const json = respuesta.ok ? await respuesta.json() : null;
            const imagenes = (json && Array.isArray(json.images) ? json.images : [])
                .filter(i => i.sampleType !== "thumbnail")
                .map(i => {
                    const archivos = i.image_files || {};
                    const url = i.https_url || i.url || archivos.large || archivos.medium || archivos.full_res;
                    return url ? { id: i.imageid, fecha: (i.date_taken || i.date_taken_utc || i.date_received || "").slice(0, 10) || `Sol ${sol}`, camara: i.instrument || (i.camera && i.camera.instrument) || "Curiosity", url: url.replace(/^http:/, "https:") } : null;
                })
                .filter(Boolean);
            if (imagenes.length) {
                return marcar(imagenes.slice(0, 60), { api: "Marte", alternativa: true,
                    fuente: "el feed oficial de imágenes de Curiosity en mars.nasa.gov", pedido: `sol ${sol}`, mostrado: `sol ${sol}` });
            }
        } catch { /* se intenta con el respaldo local */ }

        let datos;
        try { datos = await cargarRespaldo("marte"); } catch { if (error) throw error; return []; }
        const soles = Object.keys(datos.soles || {});
        let lista, mostrado;
        if (soles.length) {
            const clave = datos.soles[sol] ? String(sol) : claveMasCercana(soles, Number(sol), Number);
            lista = datos.soles[clave];
            mostrado = `sol ${clave}`;
        } else if (datos.sin_sol && datos.sin_sol.length) {
            const inicio = (Number(sol) * 12) % datos.sin_sol.length;
            lista = datos.sin_sol.slice(inicio, inicio + 24);
            mostrado = "fotos de la biblioteca de la NASA (sin número de sol)";
        } else {
            if (error) throw error;
            return [];
        }

        return marcar(lista.map(f => ({
            id: f.id || f.nasa_id,
            fecha: f.earth_date || f.fecha || (f.sol !== undefined ? `Sol ${f.sol} (fecha no informada por la NASA)` : "No disponible"),
            camara: f.camera || f.titulo,
            url: rutaLocal(f.imagen_local)
        })), { api: "Marte", motivo: error ? "La API de fotos de Marte no respondió" : "No hubo fotos para ese sol",
               generado: datos.generado, pedido: `sol ${sol}`, mostrado });
    }

    async verAsteroides(fechaInicio, fechaFin) {
        try {
            return await super.verAsteroides(fechaInicio, fechaFin);
        } catch (error) {
            let datos;
            try { datos = await cargarRespaldo("asteroides"); } catch { throw error; }
            const claves = Object.keys(datos.fechas || {}).sort();
            if (!claves.length) throw error;

            let dentro = claves.filter(f => f >= fechaInicio && f <= fechaFin);
            let mostrado = `del ${fechaInicio} al ${fechaFin}`;
            if (!dentro.length) {
                const inicio = claveMasCercana(claves, fechaInicio, diasDesdeEpoca);
                dentro = claves.filter(f => diasDesdeEpoca(f) >= diasDesdeEpoca(inicio) && diasDesdeEpoca(f) <= diasDesdeEpoca(inicio) + 7);
                mostrado = `del ${dentro[0]} al ${dentro[dentro.length - 1]} (fechas más cercanas guardadas)`;
            }
            return marcar(dentro.flatMap(f => datos.fechas[f]), {
                api: "Asteroides", motivo: "La API de asteroides no respondió",
                generado: datos.generado, pedido: `del ${fechaInicio} al ${fechaFin}`, mostrado
            });
        }
    }

    async verBiblioteca(query) {
        try {
            return await super.verBiblioteca(query);
        } catch (error) {
            let datos;
            try { datos = await cargarRespaldo("biblioteca"); } catch { throw error; }
            const items = (datos.temas || {})[query];
            if (!items || !items.length) throw error;
            return marcar(items.map(i => (i.tipo === "video"
                ? { tipo: "video", titulo: i.titulo, descripcion: i.descripcion, url: i.url_video, preview: i.imagen_local ? rutaLocal(i.imagen_local) : i.url }
                : { tipo: "imagen", titulo: i.titulo, descripcion: i.descripcion, url: i.imagen_local ? rutaLocal(i.imagen_local) : i.url })),
            { api: "Biblioteca", motivo: "La API de la biblioteca no respondió", generado: datos.generado, pedido: `tema "${query}"`, mostrado: `tema "${query}"` });
        }
    }

    /** HTML del aviso que se muestra cuando los datos vienen del respaldo o de una fuente alternativa. */
    static avisoRespaldo(lista) {
        const info = lista && lista.respaldo;
        if (!info) return "";
        const estilo = "grid-column:1/-1;width:100%;box-sizing:border-box;background:rgba(255,122,0,0.12);" +
            "border:1px solid #ff7a00;color:#ffd2a8;border-radius:10px;padding:10px 14px;margin:0 0 14px;text-align:center;font-size:14px;line-height:1.5";
        if (info.alternativa) {
            return `<div style="${estilo}">🛰️ La API de fotos de Marte de api.nasa.gov fue retirada. ` +
                `Se muestran fotos reales del rover Curiosity desde ${info.fuente}.</div>`;
        }
        const fecha = info.generado ? new Date(info.generado).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "";
        const cambio = info.pedido !== info.mostrado ? ` Pediste ${info.pedido}; se muestra ${info.mostrado}.` : "";
        return `<div style="${estilo}">📦 <b>Modo respaldo:</b> ${info.motivo}. ` +
            `Se muestran datos reales de la NASA guardados en el respaldo local${fecha ? ` (descargados el ${fecha})` : ""}.${cambio}</div>`;
    }
}

window.Servicios = ServiciosConRespaldo;
