document.getElementById("btnLogin").onclick = function () {
    const usuario = document.getElementById("u").value;
    const password = document.getElementById("p").value;

    const admins = [
        { user: "guaso", pass: "6913" },
        { user: "aleja", pass: "5313" }
    ];

    const valido = admins.some(a => a.user === usuario && a.pass === password);

    if (valido) {
        document.getElementById("login").style.display = "none";
        document.getElementById("panel").style.display = "block";
        mostrar();
    } else {
        alert("Credenciales incorrectas");
    }
};

function mostrar() {
    let subs = JSON.parse(localStorage.getItem("subs") || "[]");
    const tabla = document.getElementById("tabla");
    tabla.innerHTML = "";

    const encabezado = document.createElement("tr");
    ["Nombre", "Email", "Nacionalidad", "Celular", "Acciones"].forEach(texto => {
        const th = document.createElement("th");
        th.textContent = texto;
        encabezado.appendChild(th);
    });
    tabla.appendChild(encabezado);

    subs.forEach((s, index) => {
        const tr = document.createElement("tr");

        const tdNombre = document.createElement("td");
        tdNombre.textContent = s.nombre;

        const tdEmail = document.createElement("td");
        tdEmail.textContent = s.email;

        const tdNac = document.createElement("td");
        tdNac.textContent = s.nacionalidad || "—";

        const tdCel = document.createElement("td");
        tdCel.textContent = s.celular || "—";

        const tdAcciones = document.createElement("td");

        const btnCorreo = document.createElement("button");
        btnCorreo.textContent = "Enviar bienvenida";
        btnCorreo.onclick = () => enviarCorreo(s);

        const btnBorrar = document.createElement("button");
        btnBorrar.textContent = "Borrar";
        btnBorrar.style.marginLeft = "5px";
        btnBorrar.onclick = () => {
            if (confirm(`¿Eliminar a ${s.nombre}?`)) {
                subs.splice(index, 1);
                localStorage.setItem("subs", JSON.stringify(subs));
                mostrar();
            }
        };

        tdAcciones.appendChild(btnCorreo);
        tdAcciones.appendChild(btnBorrar);
        tr.appendChild(tdNombre);
        tr.appendChild(tdEmail);
        tr.appendChild(tdNac);
        tr.appendChild(tdCel);
        tr.appendChild(tdAcciones);
        tabla.appendChild(tr);
    });
}

function enviarCorreo(usuario) {
    let params = {
        to_name: usuario.nombre,
        to_email: usuario.email
    };

    emailjs.send("service_6xs2j1s", "template_g7nivxs", params)
        .then(() => {
            alert(`✅ Correo de bienvenida enviado a ${usuario.nombre} (${usuario.email})`);
        }, (error) => {
            console.error("Error al enviar correo:", error);
            alert("❌ No se pudo enviar el correo. Verifica la configuración de EmailJS.");
        });
}