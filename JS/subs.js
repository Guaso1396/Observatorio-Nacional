document.getElementById("form").onsubmit = function(e) {
    e.preventDefault();

    let nombre = document.getElementById("nombre").value.trim();
    let nacimiento = document.getElementById("nacimiento").value.trim();
    let nacionalidad = document.getElementById("nacionalidad").value.trim();
    let celular = document.getElementById("celular").value.trim();
    let email = document.getElementById("email").value.trim();

    if (!nombre || !nacimiento || !nacionalidad || !celular || !email) {
        alert("Por favor completa todos los campos antes de registrarte.");
        return;
    }

    let nac = new Date(nacimiento);
    let edad = (Date.now() - nac) / 31557600000;
    if (edad < 18) {
        alert("No puedes registrarte si eres menor de edad.");
        this.reset();
        return;
    }

    let user = { nombre, nacimiento, nacionalidad, celular, email };
    let list = JSON.parse(localStorage.getItem("subs") || "[]");
    list.push(user);
    localStorage.setItem("subs", JSON.stringify(list));
    alert(`✅ ¡Registro exitoso! Bienvenido(a) al Observatorio Nacional, ${nombre}. 🌌🔭`);
    this.reset();
};