import { Servicios } from '../SERVICIO/api.js';

const servicio = new Servicios();
const tablaBody = document.querySelector('#tablaAsteroides tbody');

window.buscarAsteroides = async () => {
    const fechaInicio = document.getElementById('fechaInicio').value;
    if (!fechaInicio) { alert("Seleccione una fecha de inicio"); return; }

    const inicio = new Date(fechaInicio);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    const fechaFin = fin.toISOString().split('T')[0];

    document.getElementById('rangoFechas').textContent = `Del ${fechaInicio} al ${fechaFin}`;
    tablaBody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

    try {
        const asteroides = await servicio.verAsteroides(fechaInicio, fechaFin);
        tablaBody.innerHTML = '';

        if (!asteroides.length) {
            tablaBody.innerHTML = '<tr><td colspan="7">Sin resultados</td></tr>';
            return;
        }

        asteroides.forEach(a => {
            const peligroso = a.peligroso
                ? '<span style="color:#f72a05;font-weight:bold;">⚠️ Sí</span>'
                : '<span style="color:#4caf50;">✔ No</span>';
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${a.nombre}</td>
                <td>${a.magnitud}</td>
                <td>${a.diametroMin} – ${a.diametroMax} m</td>
                <td>${peligroso}</td>
                <td>${a.fechaAcercamiento}</td>
                <td>${Number(a.distanciaKm).toLocaleString('es-CO')} km</td>
                <td>${Number(a.velocidadKph).toLocaleString('es-CO')} km/h</td>
            `;
            tablaBody.appendChild(fila);
        });

    } catch (e) {
        tablaBody.innerHTML = `
            <tr><td colspan="7" style="color:#f72a05; text-align:center; padding:20px;">
                ☄️ La API de asteroides está temporalmente fuera de servicio.<br>
                Intenta nuevamente más tarde.
            </td></tr>
        `;
    }
};