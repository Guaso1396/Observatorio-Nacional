// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9IskWnzGXdYuxyyiguJEWNYuKyuOZTNo",
  authDomain: "observatorio-nacional-76230.firebaseapp.com",
  projectId: "observatorio-nacional-76230",
  storageBucket: "observatorio-nacional-76230.firebasestorage.app",
  messagingSenderId: "524734302519",
  appId: "1:524734302519:web:4c881057bdd51e042932b2",
  measurementId: "G-S5CYF61EWW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("btnLogin").onclick = function () {
  const usuario  = document.getElementById("u").value;
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

async function mostrar() {
  const tabla = document.getElementById("tabla");
  tabla.innerHTML = "";

  const encabezado = document.createElement("tr");
  ["Nombre", "Email", "Nacionalidad", "Celular", "Acciones"].forEach(texto => {
    const th = document.createElement("th");
    th.textContent = texto;
    encabezado.appendChild(th);
  });
  tabla.appendChild(encabezado);

  try {
    const snapshot = await getDocs(collection(db, "suscriptores"));

    snapshot.forEach(docSnap => {
      const s  = docSnap.data();
      const id = docSnap.id;
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
      btnBorrar.onclick = async () => {
        if (confirm(`¿Eliminar a ${s.nombre}?`)) {
          await deleteDoc(doc(db, "suscriptores", id));
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
  } catch (err) {
    console.error(err);
    alert("❌ Error cargando suscriptores.");
  }
}

function enviarCorreo(usuario) {
  emailjs.send("service_6xs2j1s", "template_g7nivxs", {
    to_name:  usuario.nombre,
    to_email: usuario.email
  }).then(() => {
    alert(`✅ Correo enviado a ${usuario.nombre} (${usuario.email})`);
  }, (error) => {
    console.error(error);
    alert("❌ No se pudo enviar el correo.");
  });
}