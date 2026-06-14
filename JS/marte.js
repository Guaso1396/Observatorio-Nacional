import { Servicios } from '../SERVICIO/api.js';

const servicio = new Servicios();
const marteContainer = document.getElementById('marteContainer');

document.getElementById('btnMarte').addEventListener('click', async () => {
    const sol = document.getElementById('solMarte').value;

    if (!sol || sol < 0) {
        alert("Ingrese un número de Sol válido (>= 0)");
        return;
    }

    marteContainer.innerHTML = "<p style='text-align:center;'>Cargando fotos...</p>";

    try {
        const fotos = await servicio.verMarte(sol);

        if (!fotos || fotos.length === 0) {
            marteContainer.innerHTML = "<p style='text-align:center;'>No hay fotos para este Sol.</p>";
            return;
        }

        marteContainer.innerHTML = '';
        fotos.forEach(foto => {
            const card = document.createElement('div');
            card.classList.add('marte-card');
            card.innerHTML = `
                <img src="${foto.url}" alt="Foto de Marte">
                <p><strong>Fecha terrestre:</strong> ${foto.fecha}</p>
                <p><strong>Cámara:</strong> ${foto.camara}</p>
            `;
            marteContainer.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        marteContainer.innerHTML = `
            <p style="color:#f72a05; text-align:center; font-size:16px;">
                🛸 La API de Marte (NASA) está temporalmente fuera de servicio.<br>
                Intenta nuevamente más tarde.
            </p>
        `;
    }
});