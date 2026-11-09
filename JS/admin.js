// Script clásico: Firebase se carga con import() para que funcione también al abrir con doble clic
(async function () {
// Firebase SDK
const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js");
const {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence
} = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js");
const { getFirestore, collection, getDocs, deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js");

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
const auth = getAuth(app);
const db = getFirestore(app);

// La sesión se cierra automáticamente al cerrar el navegador/pestaña
setPersistence(auth, browserSessionPersistence);

// --- Login ---
const DOMINIO_ADMIN = "observatorionacional.ans.co";

document.getElementById("btnLogin").onclick = async function () {
  const usuario = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value;
  const loginError = document.getElementById("loginError");

  // El admin solo escribe "guaso" o "aleja"; aquí se completa el email real
  const email = usuario.includes("@") ? usuario : `${usuario}@${DOMINIO_ADMIN}`;

  loginError.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged se encarga de mostrar el panel
  } catch (err) {
    console.error(err);
    loginError.textContent = "Usuario o contraseña incorrectos";
  }
};

// --- Logout (opcional, agrega un botón con id="btnLogout" en el HTML) ---
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.onclick = () => {
    signOut(auth);
    document.getElementById("u").value = "";
    document.getElementById("p").value = "";
    document.getElementById("loginError").textContent = "";
  };
}

// --- Control de sesión: solo entra si Firebase Auth confirma al usuario ---
// El color se asigna por hash del UID (no por nombre/usuario), así el código
// no contiene ni expone identidades de admins.
const PALETA_COLORES = ["admin-color-1", "admin-color-2", "admin-color-3", "admin-color-4"];

function colorPorUid(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return PALETA_COLORES[hash % PALETA_COLORES.length];
}

onAuthStateChanged(auth, (user) => {
  const navAvatar = document.getElementById("navAdminAvatar");

  if (user) {
    document.getElementById("login").style.display = "none";
    document.getElementById("panelWrapper").style.display = "block";

    const claseColor = colorPorUid(user.uid);

    // Muestra el avatar en el nav, sin revelar el email/usuario del admin
    if (navAvatar) {
      navAvatar.style.display = "block";

      const btnAvatar = document.getElementById("btnNavAvatar");
      btnAvatar.className = ""; // limpia clases previas
      btnAvatar.classList.add(claseColor);
    }

    mostrar();
  } else {
    document.getElementById("login").style.display = "block";
    document.getElementById("panelWrapper").style.display = "none";
    if (navAvatar) {
      navAvatar.style.display = "none";
      document.getElementById("navAdminMenu").classList.remove("show");
    }
  }
});

// --- Dropdown del avatar en el nav ---
const btnNavAvatar = document.getElementById("btnNavAvatar");
const navAdminMenu = document.getElementById("navAdminMenu");

if (btnNavAvatar) {
  btnNavAvatar.onclick = (e) => {
    e.stopPropagation();
    navAdminMenu.classList.toggle("show");
  };

  // Cierra el dropdown al hacer click afuera
  document.addEventListener("click", (e) => {
    if (!navAdminMenu.contains(e.target) && e.target !== btnNavAvatar) {
      navAdminMenu.classList.remove("show");
    }
  });
}

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
})();
