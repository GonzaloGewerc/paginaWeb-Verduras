/* ============================
   verduras.js
   ============================ */

const PHONE = "+543515208891";
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const digitsOnly = (str) => (str || '').replace(/\D+/g, '');
const showToast = (msg) => { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"), 2400); };

/* Placeholder SVG (compat) */
const svgPlaceholder = (text = "Producto", bg = "#1b3a2b") => {
  const fg = "#eaf5ee";
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${bg}'/><stop offset='1' stop-color='#0e1a14'/>
      </linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='system-ui,Segoe UI,Roboto,Arial' font-size='64' fill='${fg}' opacity='.85'>${text}</text>
    </svg>`
  );
  return `data:image/svg+xml;utf8,${svg}`;
};

/* ============================
   IMÁGENES LOCALES PARA CADA PRODUCTO
   ============================ */
const PRODUCTS = [
  { id:"clasico",  nombre:"Bolsón Clásico",      precio:7990,  badge:"Ideal para 1–2 personas",
    items:["1 kg manzana","1 kg papa","1/2 kg zanahoria","1 lechuga"], emoji:"🍎",
    img:"zanahoria.JPG" },

  { id:"familiar", nombre:"Bolsón Familiar",     precio:12990, badge:"Rinde 3–4 personas",
    items:["2 kg papa","1 kg cebolla","1 kg banana","1 cabutia"], emoji:"🥦",
    img:"PALTA.JPG" },

  { id:"fit",      nombre:"Bolsón Fit",          precio:9990,  badge:"Verde y liviano",
    items:["Espinaca","Acelga","Pepino","Naranja"], emoji:"🥬",
    img:"manzana.JPG" },

  { id:"asados",   nombre:"Bolsón Parrillero",   precio:8990,  badge:"Para guarniciones",
    items:["Papas","Batata","Cebolla","Morrón"], emoji:"🌶️",
    img:"mandarina.JPG" },

  { id:"juicy",    nombre:"Mix Jugos",           precio:8590,  badge:"Para licuados",
    items:["Naranja","Zanahoria","Manzana","Apio"], emoji:"🍊",
    img:"zanahoria.JPG" },

  { id:"huerta",   nombre:"Huerta Fresca",       precio:10990, badge:"De estación",
    items:["Lechuga","Tomate","Pepino","Rúcula"], emoji:"🥒",
    img:"PALTA.JPG" },

  { id:"premium",  nombre:"Selección Premium",   precio:16990, badge:"Top calidad",
    items:["Frutillas","Arándanos","Palta","Tomate premium"], emoji:"🍓",
    img:"manzana.JPG" },

  { id:"escuela",  nombre:"Colación Escolar",    precio:6990,  badge:"Snacks saludables",
    items:["Banana","Mandarina","Manzana","Zanahoria baby"], emoji:"🍌",
    img:"mandarina.JPG" },
];

const form = $("#orderForm");
const nombre = $("#nombre");
const ubicacion = $("#ubicacion");
const bolson = $("#bolson");
const pago = $("#pago");
const comentarios = $("#comentarios");
const resumen = $("#resumen");
const formStatus = $("#formStatus");
const productsGrid = $("#productsGrid");
const prevBtn = $(".carousel-btn.prev");
const nextBtn = $(".carousel-btn.next");

const btnGeo = $("#btnGeo");
const mapWrap = $("#mapPreview");
const mapFrame = $("#mapFrame");
const mapsLinkWrap = $("#mapsLinkWrap");
const mapsLink = $("#mapsLink");
const latInput = $("#lat");
const lngInput = $("#lng");
const emailBtn = $("#enviarEmail");
$("#anio").textContent = new Date().getFullYear();

/* Compat: si existen cards con data-bg en HTML estático */
$$(".card[data-bg]").forEach(card => {
  const src = card.getAttribute("data-bg");
  if (src) card.style.setProperty("--bg-img", `url('${src}')`);
});

/* ========= CARRUSEL RESPONSIVE ========= */
const getItemsPerView = () => (window.innerWidth < 768 ? 1 : 4);
let itemsPerView = getItemsPerView();
let startIndex = 0;

/* Gestión de focus tras navegar con teclado */
let lastNavViaKeyboard = false;
const markKeyboardNav = (e) => { if (e.key === "Enter" || e.key === " ") lastNavViaKeyboard = true; };
prevBtn?.addEventListener("keydown", markKeyboardNav);
nextBtn?.addEventListener("keydown", markKeyboardNav);
prevBtn?.addEventListener("mousedown", () => lastNavViaKeyboard = false);
nextBtn?.addEventListener("mousedown", () => lastNavViaKeyboard = false);

/* ========== Lazy load para background de las cards ========== */
let bgObserver = null;
const ensureBgObserver = () => {
  if (!('IntersectionObserver' in window)) return null;
  if (!bgObserver) {
    bgObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const src = card.dataset.bg;
        if (src) {
          card.style.setProperty('--bg-img', `url('${src}')`);
          card.classList.remove('bg-lazy');
          card.removeAttribute('data-bg');
        }
        obs.unobserve(card);
      });
    }, { rootMargin: '300px 0px' });
  }
  return bgObserver;
};
const observeCardBg = (card) => {
  const src = card.dataset.bg;
  if (!src) return;
  const io = ensureBgObserver();
  if (io) io.observe(card);
  else {
    card.style.setProperty('--bg-img', `url('${src}')`);
    card.classList.remove('bg-lazy');
    card.removeAttribute('data-bg');
  }
};

/* Render de página (usa background-image en .card) */
const renderPage = () => {
  if (!productsGrid) return;
  productsGrid.setAttribute("aria-busy", "true");
  productsGrid.innerHTML = "";

  for (let i = 0; i < itemsPerView; i++) {
    const p = PRODUCTS[(startIndex + i) % PRODUCTS.length];
    const article = document.createElement("article");
    article.className = "card bg-lazy";
    article.dataset.packId = p.id;
    article.dataset.packNombre = p.nombre;
    article.dataset.packPrecio = String(p.precio);
    article.dataset.bg = p.img;

    article.innerHTML = `
      <div class="card-content">
        <div class="card-head">
          <div class="illus" aria-hidden="true">${p.emoji}</div>
          <div>
            <div class="card-title">${p.nombre}</div>
            <div class="badge">${p.badge}</div>
          </div>
        </div>

        <div class="pill-icons">
          ${p.items.map(it => `<span>• ${it}</span>`).join("")}
        </div>

        <div class="card-actions">
          <span class="price">${formatCurrency(p.precio)}</span>
          <button class="btn mini js-elegir" type="button">Elegir</button>
        </div>
      </div>
    `;

    productsGrid.appendChild(article);
    observeCardBg(article);
  }

  // Re-enlazar botones "Elegir" (AGREGA al múltiple)
  $$(".js-elegir", productsGrid).forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".card");
      const id = card?.dataset.packId;
      if (!id) return;

      // buscá o creá la opción en el <select>
      let opt = Array.from(bolson.options).find(o => o.value === id);
      if (!opt) {
        const prod = PRODUCTS.find(pr => pr.id === id);
        if (prod) {
          opt = new Option(`${prod.nombre} — ${formatCurrency(prod.precio)}`, prod.id);
          opt.dataset.precio = String(prod.precio);
          bolson.appendChild(opt);
        }
      }
      // marcá como seleccionado sin deseleccionar otros
      if (opt) opt.selected = true;

      bolson.dispatchEvent(new Event('change'));
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      nombre.focus({ preventScroll: true });
    });
  });

  productsGrid.setAttribute("aria-busy", "false");

  if (lastNavViaKeyboard) {
    const firstBtn = $(".js-elegir", productsGrid);
    if (firstBtn) firstBtn.focus({ preventScroll: true });
    lastNavViaKeyboard = false;
  } else {
    productsGrid.focus({ preventScroll: true });
  }
};

const nextPage = () => { startIndex = (startIndex + itemsPerView) % PRODUCTS.length; renderPage(); };
const prevPage = () => { startIndex = (startIndex - itemsPerView + PRODUCTS.length * 10) % PRODUCTS.length; renderPage(); };
prevBtn?.addEventListener("click", prevPage);
nextBtn?.addEventListener("click", nextPage);

/* Poblar select con todos los packs */
const populateSelect = () => {
  const existingValues = new Set(Array.from(bolson.options).map(o => o.value));
  PRODUCTS.forEach(p => {
    if (!existingValues.has(p.id)) {
      const opt = new Option(`${p.nombre} — ${formatCurrency(p.precio)}`, p.id);
      opt.dataset.precio = String(p.precio);
      bolson.appendChild(opt);
    }
  });
};

/* Resumen soporta MULTI selección */
const updateResumen = () => {
  const sel = Array.from(bolson.selectedOptions || []);
  if (!sel.length) {
    resumen.innerHTML = `<strong>Resumen:</strong> Seleccioná uno o varios bolsones para ver el total.`;
    return;
  }
  const items = sel.map(o => {
    const name = (o.textContent || "").split(" — ")[0] || o.value;
    const price = Number(o.dataset.precio || 0);
    return { name, price };
  });
  const total = items.reduce((acc, it) => acc + (it.price || 0), 0);
  const list = items.map(i => `• ${i.name} (${formatCurrency(i.price)})`).join("<br>");
  resumen.innerHTML = `<strong>Resumen:</strong><br>${list}<br>→ Total: <strong>${formatCurrency(total)}</strong>`;
};
bolson.addEventListener("change", updateResumen);

/* Validación (múltiple) */
const requiredFields = [
  { el: nombre, wrap: "#f-nombre", msg: "Ingresá tu nombre." },
  { el: bolson, wrap: "#f-bolson", msg: "Seleccioná al menos un bolsón." },
  { el: pago,   wrap: "#f-pago",   msg: "Elegí una forma de pago." },
];
const ubicacionIsProvided = () => {
  const lat = (latInput.value || "").trim();
  const lng = (lngInput.value || "").trim();
  const hasCoords = lat && lng;
  const hasText = (ubicacion.value || "").trim().length > 0;
  return hasCoords || hasText;
};
const clearInvalid = () => {
  requiredFields.forEach(({ wrap }) => $(wrap)?.classList.remove("invalid"));
  $("#f-ubicacion")?.classList.remove("invalid");
  formStatus.textContent = "";
};
const validate = () => {
  clearInvalid();
  let valid = true;

  requiredFields.forEach(({ el, wrap, msg }) => {
    let isEmpty = false;
    if (el === bolson) {
      isEmpty = (Array.from(bolson.selectedOptions || []).length === 0);
    } else {
      isEmpty = !(el.value || "").trim();
    }
    if (isEmpty) {
      $(wrap)?.classList.add("invalid");
      $(wrap + " .error").textContent = msg;
      valid = false;
    }
  });

  if (!ubicacionIsProvided()) {
    $("#f-ubicacion")?.classList.add("invalid");
    $("#f-ubicacion .error").textContent = "Ingresá tu ubicación o compartí tu ubicación actual.";
    valid = false;
  }

  if (!valid) {
    showToast("Completá los campos requeridos.");
    formStatus.textContent = "Hay campos obligatorios sin completar.";
  }
  return valid;
};

/* Links de Maps */
const buildMapsLinks = () => {
  const lat = (latInput.value || "").trim();
  const lng = (lngInput.value || "").trim();
  const dir = (ubicacion.value || "").trim();

  if (lat && lng) {
    const base = `https://www.google.com/maps?q=${lat},${lng}`;
    return { embed: `${base}&z=15&output=embed`, view: `${base}&z=15`, label: `Coordenadas: ${lat}, ${lng}` };
  }
  if (dir) {
    const q = encodeURIComponent(dir);
    const view = `https://www.google.com/maps/search/?api=1&query=${q}`;
    return { embed: "", view, label: dir };
  }
  return { embed: "", view: "", label: "" };
};

/* Línea y mensaje soportan MULTI selección */
const buildOrderLine = () => {
  const sel = Array.from(bolson.selectedOptions || []);
  if (!sel.length) return "• Bolsones: No especificados";
  const items = sel.map(o => {
    const precio = Number(o.dataset.precio || 0);
    const nombrePack = (o.textContent || "").split(" — ")[0] || o.value;
    return { nombrePack, precio };
  });
  const total = items.reduce((a, b) => a + b.precio, 0);
  const list = items.map(i => `   - ${i.nombrePack} (${formatCurrency(i.precio)})`).join("\n");
  return `• Bolsones:\n${list}\n• Total: ${formatCurrency(total)}`;
};

const buildMessage = () => {
  const maps = buildMapsLinks();
  const lines = [
    "¡Hola! Quiero hacer un pedido 🙌",
    `• Nombre: ${nombre.value.trim()}`,
    `• Ubicación: ${maps.label || "No especificada"}`,
    buildOrderLine(),
    `• Forma de pago: ${pago.value}`,
  ];
  if (maps.view) lines.push(`• Google Maps: ${maps.view}`);
  if (comentarios.value.trim()) lines.push(`• Comentarios: ${comentarios.value.trim()}`);
  return lines.join("\n");
};

/* Envíos */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;

  const phoneDigits = digitsOnly(PHONE);
  if (!phoneDigits) {
    showToast("Configurá tu número de WhatsApp en verduras.js (const PHONE).");
    return;
  }

  const text = buildMessage();
  const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) location.href = url;
});

emailBtn?.addEventListener("click", () => {
  if (!validate()) return;
  const subject = "Pedido";
  const body = buildMessage();
  const mailto = `mailto:gongewerc@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  location.href = mailto;
});

/* Interacciones */
[...[nombre, ubicacion, bolson, pago, comentarios]].forEach(el => {
  el?.addEventListener("input", clearInvalid);
  el?.addEventListener("change", clearInvalid);
});

ubicacion?.addEventListener("input", () => {
  if ((ubicacion.value || "").trim()) {
    latInput.value = "";
    lngInput.value = "";
    const { view } = buildMapsLinks();
    if (view) {
      mapsLink.href = view;
      mapsLinkWrap.hidden = false;
      formStatus.textContent = "Link a Google Maps actualizado para la dirección escrita.";
    } else {
      mapsLinkWrap.hidden = true;
    }
    mapWrap.hidden = true;
    mapFrame.removeAttribute("src");
  }
});

/* Geolocalización */
btnGeo?.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    showToast("Tu navegador no soporta geolocalización.");
    ubicacion.focus();
    return;
  }
  btnGeo.disabled = true;
  btnGeo.textContent = "Obteniendo...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      latInput.value = latitude.toFixed(6);
      lngInput.value = longitude.toFixed(6);
      ubicacion.value = `Coordenadas: ${latInput.value}, ${lngInput.value}`;
      const { embed, view } = buildMapsLinks();
      if (embed) { mapFrame.src = embed; mapWrap.hidden = false; }
      if (view) { mapsLink.href = view; mapsLinkWrap.hidden = false; }
      formStatus.textContent = "Ubicación obtenida. Mapa y enlace listos.";
      btnGeo.disabled = false;
      btnGeo.textContent = "Usar mi ubicación";
      clearInvalid();
    },
    () => {
      btnGeo.disabled = false;
      btnGeo.textContent = "Usar mi ubicación";
      showToast("No pudimos obtener tu ubicación. Escribí una dirección manual.");
      $("#f-ubicacion")?.classList.add("invalid");
      ubicacion.focus();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
});

/* Debounce resize */
const debounce = (fn, d = 150) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), d); }; };
const handleResize = () => {
  const prev = itemsPerView;
  const next = getItemsPerView();
  if (prev !== next) {
    const pageIndex = Math.floor(startIndex / prev);
    itemsPerView = next;
    startIndex = (pageIndex * itemsPerView) % PRODUCTS.length;
    renderPage();
  }
};
window.addEventListener("resize", debounce(handleResize, 150));

/* Init */
const populateSelectAndInit = () => {
  populateSelect();
  updateResumen();
  itemsPerView = getItemsPerView();
  renderPage();
};
populateSelectAndInit();

/* ====== NAVBAR: drawer con focus trap ====== */
const menuButton = $("#menuButton");
const mobileNav = $("#mobileNav");
const backdrop = $("#backdrop");
const closeDrawerBtn = $("#closeDrawer");
const mainContent = $("main");
const header = $(".header");

let prevFocused = null;
const focusablesSelector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

const trapFocus = (e) => {
  if (e.key !== "Tab") return;
  const f = $$(focusablesSelector, mobileNav).filter(el => !el.hasAttribute("disabled"));
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
};
const escToClose = (e) => { if (e.key === "Escape") closeDrawer(); };

const openDrawer = () => {
  if (!mobileNav || !backdrop) return;
  prevFocused = document.activeElement;
  mobileNav.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => { mobileNav.classList.add("open"); backdrop.classList.add("show"); });
  document.body.classList.add("no-scroll");
  document.body.classList.add("menu-open");
  menuButton.setAttribute("aria-expanded", "true");
  mainContent?.setAttribute("aria-hidden", "true");
  header?.setAttribute("aria-hidden", "true");
  const f = $(focusablesSelector, mobileNav); f?.focus();
  mobileNav.addEventListener("keydown", trapFocus);
  document.addEventListener("keydown", escToClose);
};
const closeDrawer = () => {
  if (!mobileNav || !backdrop) return;
  mobileNav.classList.remove("open");
  backdrop.classList.remove("show");
  document.body.classList.remove("no-scroll");
  document.body.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  mainContent?.removeAttribute("aria-hidden");
  header?.removeAttribute("aria-hidden");
  setTimeout(() => {
    mobileNav.hidden = true;
    backdrop.hidden = true;
    mobileNav.removeEventListener("keydown", trapFocus);
    document.removeEventListener("keydown", escToClose);
  }, 220);
  prevFocused?.focus?.();
};

menuButton?.addEventListener("click", () => openDrawer());
closeDrawerBtn?.addEventListener("click", () => closeDrawer());
backdrop?.addEventListener("click", () => closeDrawer());
$$("[data-nav-link]").forEach(a => a.addEventListener("click", () => closeDrawer()));
window.addEventListener("resize", () => { if (window.innerWidth >= 900 && !mobileNav.hidden) closeDrawer(); });
