import { Servicios } from "../SERVICIO/api.js";

document.addEventListener("DOMContentLoaded", () => {
  const servicio = new Servicios();
  const btnBuscar = document.getElementById("btnBuscar");
  const inputBuscar = document.getElementById("buscar");
  const resultados = document.getElementById("resultados");

  function mostrarResultados(datos) {
    resultados.innerHTML = "";

    if (!datos || datos.length === 0) {
      resultados.innerHTML = "<p>No se encontraron resultados.</p>";
      return;
    }

    datos.forEach(item => {
      if (item.tipo === "imagen") {
        resultados.innerHTML += `
          <div class="card">
            <img src="${item.url}" alt="${item.titulo}">
            <div class="info">
              <h3>${item.titulo}</h3>
              <p>${item.descripcion.substring(0, 150)}...</p>
            </div>
          </div>
        `;
      }

      if (item.tipo === "video") {
          resultados.innerHTML += `
              <div class="card">
                  <video controls preload="none" poster="${item.preview}" style="width:100%;height:200px;object-fit:cover;">
                      <source src="${item.url}" type="video/mp4">
                      Tu navegador no soporta videos.
                  </video>
                  <div class="info">
                      <h3>${item.titulo}</h3>
                      <p>${item.descripcion.substring(0, 150)}...</p>
                  </div>
              </div>
          `;
      }
    });
  }

  async function buscar(query) {
    try {
      resultados.innerHTML = "<p>Buscando...</p>";
      const datos = await servicio.verBiblioteca(query);
      mostrarResultados(datos);
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      resultados.innerHTML = "<p>Error al obtener resultados.</p>";
    }
  }

  btnBuscar.addEventListener("click", () => {
    const query = inputBuscar.value;
    if (query) {
      buscar(query);
    } else {
      alert("Selecciona un tema para buscar.");
    }
  });
});