let carrusel = document.querySelector('.carrusel');
let lista = carrusel.querySelector('.lista');
let btnAtras = document.getElementById('atras');
let btnSiguiente = document.getElementById('siguiente');

btnSiguiente.onclick = () => {
    let items = lista.querySelectorAll('.items');
    lista.appendChild(items[0]);
    carrusel.classList.remove('prev');
    carrusel.classList.add('next');
};

btnAtras.onclick = () => {
    let items = lista.querySelectorAll('.items');
    lista.prepend(items[items.length - 1]);
    carrusel.classList.remove('next');
    carrusel.classList.add('prev');
};

async function cargarImagenAstronomica() {
    const url = "https://api.nasa.gov/planetary/apod?api_key=ls42GTOyJCrx4nmx9cmxEJDsJWycYlW6UNh90kWa";
    try {
        let respuesta = await fetch(url);
        let datos = await respuesta.json();

        let img = document.getElementById("imagenAstronomica");
        let imgPeq = document.getElementById("imagenAstronomicaPeq");

        if (datos.media_type === "image") {
            img.onload = () => { img.style.opacity = 1; };
            img.src = datos.url;
            img.alt = datos.title;
            imgPeq.onload = () => { imgPeq.style.opacity = 1; };
            imgPeq.src = datos.url;
            imgPeq.alt = datos.title;
        } else if (datos.media_type === "video") {
            let iframe = document.createElement("iframe");
            iframe.src = datos.url;
            iframe.width = "100%";
            iframe.height = "400";
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowfullscreen", "true");
            img.replaceWith(iframe);

            if (datos.thumbnail_url) {
                imgPeq.src = datos.thumbnail_url;
                imgPeq.alt = datos.title;
            } else {
                imgPeq.src = "IMG/Iconos/video_icon.png";
                imgPeq.alt = "Video: " + datos.title;
            }
        }

    } catch (error) {
        console.error("Error al cargar la imagen de la NASA:", error);
        const img = document.getElementById("imagenAstronomica");
        if (img) {
            img.alt = "Imagen no disponible temporalmente.";
            img.style.display = "none";
        }
        const contenedor = img?.parentElement;
        if (contenedor) {
            contenedor.innerHTML += `
                <p style="color:#f72a05; text-align:center; font-size:16px;">
                    🔭 La imagen astronómica del día no está disponible temporalmente.<br>
                    Intenta nuevamente más tarde.
                </p>
            `;
        }
    }
}

cargarImagenAstronomica();