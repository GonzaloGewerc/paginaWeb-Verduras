/* ============================
   verduras.js
   (Archivo de lógica JS)
   Explicado paso a paso.
   ============================ */

/* 1) CONFIGURACIÓN: tu número de WhatsApp.
      Poné tu número con código de país, sin espacios.
      Ejemplo: +5491122334455 (Argentina con 9 para celular). */
const PHONE = "+543515208891";

/* 2) Atajos para buscar elementos en el HTML de forma fácil. */
const $ = (sel, ctx = document) => ctx.querySelector(sel);          // Busca 1 elemento.
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)); // Busca varios elementos.

/* 3) Función para formatear números como pesos argentinos (ARS). */
const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

/* 4) Función que deja SOLO los dígitos (saca +, espacios, guiones). */
const digitsOnly = (str) => (str || '').replace(/\D+/g, '');

/* 5) Función para mostrar un cartelito flotante por unos segundos. */
const showToast = (msg) => {
  const el = $("#toast");        // Buscamos el div del toast.
  el.textContent = msg;          // Cambiamos el texto por el mensaje que pasamos.
  el.classList.add("show");      // Le ponemos la clase que lo hace visible.
  setTimeout(() => el.classList.remove("show"), 2400); // A los 2.4s lo escondemos.
};

/* 6) Tomamos referencias a los elementos del formulario que necesitamos. */
const form = $("#orderForm");         // El formulario completo.
const nombre = $("#nombre");          // Campo: nombre.
const ubicacion = $("#ubicacion");    // Campo: ubicación.
const bolson = $("#bolson");          // Campo: select del bolsón.
const pago = $("#pago");              // Campo: forma de pago.
const comentarios = $("#comentarios");// Campo: comentarios.
const resumen = $("#resumen");        // Texto que muestra el total.
const formStatus = $("#formStatus");  // Mensaje invisible para accesibilidad.

/* 7) Mostrar el año actual en el footer automáticamente. */
$("#anio").textContent = new Date().getFullYear();

/* 8) Poner la imagen de fondo en cada card:
      - Leemos el atributo data-bg del HTML.
      - Lo guardamos como variable CSS --bg-img para que el CSS lo use. */
$$(".card[data-bg]").forEach(card => {
  const src = card.getAttribute("data-bg");                   // Tomamos la ruta de la imagen.
  if (src) card.style.setProperty("--bg-img", `url('${src}')`); // La guardamos en --bg-img.
});

/* 9) Cuando apretamos "Elegir" en una card:
      - Marcamos ese bolsón en el <select>.
      - Bajamos al formulario para completar los datos. */
$$(".js-elegir").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const card = e.currentTarget.closest(".card");         // Buscamos la card donde está el botón.
    const id = card?.dataset.packId;                       // Leemos su id (clasico/familiar/fit).
    if (!id) return;                                       // Si no hay id, nos vamos.

    // Buscamos en el <select> la opción con ese id y la elegimos.
    const opt = Array.from(bolson.options).find(o => o.value === id);
    if (opt) {
      bolson.value = opt.value;                            // Marcamos esa opción.
      bolson.dispatchEvent(new Event('change'));           // Disparamos el "change" para refrescar resumen.
      form.scrollIntoView({ behavior: "smooth", block: "start" }); // Bajamos suave al formulario.
      nombre.focus({ preventScroll: true });               // Ponemos el cursor en "Nombre".
    }
  });
});

/* 10) Actualizar el resumen (nombre del bolsón y precio) cuando cambie el <select>. */
const updateResumen = () => {
  const opt = bolson.selectedOptions?.[0];                 // Opción elegida.
  if (!opt || !opt.value) {                                // Si no hay bolsón elegido:
    resumen.innerHTML = `<strong>Resumen:</strong> Seleccioná un bolsón para ver el total.`; // Mensaje base.
    return;                                                // Nos vamos.
  }
  const label = opt.textContent || "Bolsón";               // Texto de la opción (incluye nombre y precio).
  const precio = Number(opt.dataset.precio || 0);          // Precio guardado en data-precio.
  resumen.innerHTML = `<strong>Resumen:</strong> ${label} → Total: <strong>${formatCurrency(precio)}</strong>`; // Mostramos total.
};
bolson.addEventListener("change", updateResumen);          // Cada vez que elijas, actualiza.

/* 11) Reglas simples para validar que los campos obligatorios no estén vacíos. */
const requiredFields = [
  { el: nombre, wrap: "#f-nombre", msg: "Ingresá tu nombre." },
  { el: ubicacion, wrap: "#f-ubicacion", msg: "Ingresá tu ubicación." },
  { el: bolson, wrap: "#f-bolson", msg: "Seleccioná un bolsón." },
  { el: pago, wrap: "#f-pago", msg: "Elegí una forma de pago." },
];

/* 12) Limpiar marcas de error. */
const clearInvalid = () => {
  requiredFields.forEach(({ wrap }) => $(wrap)?.classList.remove("invalid")); // Sacamos la clase "invalid".
  formStatus.textContent = "";                                               // Borramos mensaje accesible.
};

/* 13) Validar: si falta algo, marcamos en rojo y avisamos con un toast. */
const validate = () => {
  clearInvalid();                                       // Primero limpiamos errores viejos.
  let valid = true;                                     // Suponemos que está todo bien.
  requiredFields.forEach(({ el, wrap, msg }) => {       // Miramos cada campo obligatorio.
    const value = (el.value || "").trim();              // Leemos el valor y sacamos espacios.
    const empty = !value;                                // ¿Está vacío?
    if (empty) {                                        // Si falta:
      $(wrap)?.classList.add("invalid");                // Marcamos en rojo ese campo.
      $(wrap + " .error").textContent = msg;            // Mostramos el mensajito de error.
      valid = false;                                    // Ya no es válido.
    }
  });
  if (!valid) {                                         // Si algo faltó:
    showToast("Completá los campos requeridos.");       // Mostramos el cartelito.
    formStatus.textContent = "Hay campos obligatorios sin completar."; // Mensaje accesible.
  }
  return valid;                                         // Devolvemos true/false.
};

/* 14) Armar el texto que mandaremos por WhatsApp con todos los datos. */
const buildWhatsAppMessage = () => {
  const opt = bolson.selectedOptions?.[0];              // Opción elegida del bolsón.
  const precio = Number(opt?.dataset?.precio || 0);     // Precio de esa opción.
  const nombrePack = opt ? opt.textContent.split(" — ")[0] : "No especificado"; // Sacamos el nombre antes del " — ".

  const lines = [
    "¡Hola! Quiero hacer un pedido 🙌",                 // Saludo.
    `• Nombre: ${nombre.value.trim()}`,                // Nombre de la persona.
    `• Ubicación: ${ubicacion.value.trim()}`,          // Ubicación.
    `• Bolsón: ${nombrePack}`,                         // Cuál bolsón eligió.
    `• Forma de pago: ${pago.value}`,                  // Cómo va a pagar.
  ];

  if (precio) lines.push(`• Total: ${formatCurrency(precio)}`); // Agregamos total si hay precio.
  if (comentarios.value.trim()) lines.push(`• Comentarios: ${comentarios.value.trim()}`); // Comentarios opcionales.

  return lines.join("\n");                              // Unimos todo con saltos de línea.
};

/* 15) Cuando se "envía" el formulario:
       - Validamos.
       - Si está bien, abrimos WhatsApp con el mensaje listo. */
form.addEventListener("submit", (e) => {
  e.preventDefault();                                   // Evita que la página se recargue.
  if (!validate()) return;                              // Si falta algo, no seguimos.

  const phoneDigits = digitsOnly(PHONE);                // Nos quedamos solo con los números del teléfono.
  if (!phoneDigits) {                                   // Si no configuraste el número:
    showToast("Configurá tu número de WhatsApp en verduras.js (const PHONE)."); // Avisamos.
    return;                                            // Y cortamos.
  }

  const text = buildWhatsAppMessage();                  // Armamos el mensaje.
  const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`; // Creamos el link a WhatsApp.

  // Intentamos abrir en una pestaña nueva.
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {                                          // Si el navegador bloquea el popup:
    location.href = url;                                // Abrimos en la misma pestaña como plan B.
  }
});

/* 16) Si el usuario empieza a escribir, limpiamos los errores automáticamente. */
[...requiredFields.map(r => r.el), comentarios].forEach(el => {
  el.addEventListener("input", clearInvalid);           // Al escribir, limpiamos.
  el.addEventListener("change", clearInvalid);          // Al cambiar selección, limpiamos.
});

/* 17) Al cargar la página, actualizamos el resumen por si ya hay algo seleccionado. */
updateResumen();
