import { Servicios } from '../SERVICIO/api.js';

const servicio = new Servicios();
const epicContainer = document.getElementById('epicContainer');

window.cargarEpic = async () => {
    const fecha = document.getElementById('fechaEpic').value;
    if (!fecha) return;

    epicContainer.innerHTML = "<p style='text-align:center;'>Cargando imágenes...</p>";

    try {
        const fotos = await servicio.verTierra(fecha);
        epicContainer.innerHTML = '';

        if (!fotos || fotos.length === 0) {
            epicContainer.innerHTML = "<p style='text-align:center;'>No hay imágenes para esta fecha.</p>";
            return;
        }

        fotos.forEach(foto => {
            const card = document.createElement('div');
            card.classList.add('epic-card');
            card.innerHTML = `
                <img src="${foto.url}" alt="Imagen de la Tierra - ${foto.nombre}"
                    onerror="this.onerror=null; this.src='../IMG/Iconos/Tierra.png'; this.style.opacity='0.5';"
                    loading="lazy">
                <div class="card-info">
                    <p><strong>Nombre:</strong> ${foto.nombre}</p>
                    <p><strong>Fecha:</strong> ${new Date(foto.fecha).toLocaleString()}</p>
                    ${foto.caption ? `<p><strong>Descripción:</strong> ${foto.caption}</p>` : ''}
                </div>
            `;
            epicContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando imágenes EPIC:", error);
        epicContainer.innerHTML = `
            <p style="color:#f72a05; text-align:center; font-size:16px;">
                🌍 La API de imágenes de la Tierra está temporalmente fuera de servicio.<br>
                Intenta nuevamente más tarde.
            </p>
        `;
    }
};