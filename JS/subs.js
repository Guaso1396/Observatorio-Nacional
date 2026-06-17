// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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

document.getElementById("form").onsubmit = async function(e) {
  e.preventDefault();

  const nombre      = document.getElementById("nombre").value.trim();
  const nacimiento  = document.getElementById("nacimiento").value.trim();
  const nacionalidad = document.getElementById("nacionalidad").value.trim();
  const celular     = document.getElementById("celular").value.trim();
  const email       = document.getElementById("email").value.trim();

  if (!nombre || !nacimiento || !nacionalidad || !celular || !email) {
    alert("Por favor completa todos los campos antes de registrarte.");
    return;
  }

  const nac = new Date(nacimiento);
  const edad = (Date.now() - nac) / 31557600000;
  if (edad < 18) {
    alert("No puedes registrarte si eres menor de edad.");
    this.reset();
    return;
  }

  try {
    await addDoc(collection(db, "suscriptores"), {
      nombre, nacimiento, nacionalidad, celular, email,
      fechaRegistro: new Date().toISOString()
    });
    alert(`✅ ¡Registro exitoso! Bienvenido(a) al Observatorio Nacional, ${nombre}. 🌌🔭`);
    this.reset();
  } catch (err) {
    console.error(err);
    alert("❌ Error al guardar. Intenta de nuevo.");
  }
};