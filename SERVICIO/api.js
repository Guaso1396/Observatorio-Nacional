export class Servicios {

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

    // Fotos de Marte
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
            console.error("Error en verMarte:", error);
            throw error;
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
