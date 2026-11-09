// Menú desplegable "Games": abre/cierra con clic o toque (en escritorio también con hover vía CSS)
(function () {
    const menus = document.querySelectorAll(".menu-juegos");

    menus.forEach(menu => {
        const boton = menu.querySelector(".menu-juegos-boton");
        if (!boton) return;

        boton.addEventListener("click", e => {
            e.stopPropagation();
            const abierto = menu.classList.toggle("abierto");
            boton.setAttribute("aria-expanded", abierto ? "true" : "false");
        });

        // Marca el juego de la página actual
        const paginaActual = location.pathname.split("/").pop();
        menu.querySelectorAll(".menu-juegos-lista a").forEach(enlace => {
            if (enlace.getAttribute("href").split("/").pop() === paginaActual) {
                enlace.classList.add("activo");
            }
        });
    });

    function cerrarTodos() {
        menus.forEach(menu => {
            menu.classList.remove("abierto");
            const boton = menu.querySelector(".menu-juegos-boton");
            if (boton) boton.setAttribute("aria-expanded", "false");
        });
    }

    document.addEventListener("click", e => {
        if (!e.target.closest(".menu-juegos")) cerrarTodos();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") cerrarTodos();
    });
})();
