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

/* ====== Menú hamburguesa (móvil) ====== */
const menuBtn = $("#menuButton");
const mobileNav = $("#mobileNav");
const backdropEl = $("#backdrop");
const closeDrawerBtn = $("#closeDrawer");
const navLinks = $$("[data-nav-link]");

const openDrawer = () => {
  if (!mobileNav || !backdropEl || !menuBtn) return;
  mobileNav.hidden = false;
  backdropEl.hidden = false;
  requestAnimationFrame(() => {
    mobileNav.classList.add("open");
    backdropEl.classList.add("show");
    document.body.classList.add("no-scroll");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  });
};
const closeDrawer = () => {
  if (!mobileNav || !backdropEl || !menuBtn) return;
  mobileNav.classList.remove("open");
  backdropEl.classList.remove("show");
  document.body.classList.remove("no-scroll", "menu-open");
  menuBtn.setAttribute("aria-expanded", "false");
  setTimeout(() => { mobileNav.hidden = true; backdropEl.hidden = true; }, 250);
};
menuBtn?.addEventListener("click", openDrawer);
closeDrawerBtn?.addEventListener("click", closeDrawer);
backdropEl?.addEventListener("click", closeDrawer);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
navLinks.forEach(a => a.addEventListener("click", closeDrawer));

/* Catálogo (imágenes locales) */
const PRODUCTS = [
  { id:"clasico",  nombre:"Bolsón De Verduras", precio:7990,  badge:"Peso: 9 kg",
    items:["Zanahoria","Cebolla de verdeo","Puerro","Acelga","Pimientos rojo y verde","Batata"], emoji:"",
    img:"imagen uno.webp" },
  { id:"familiar", nombre:"Bolsón de Papa y Cebolla", precio:12990, badge:"Peso: 6 kg",
    items:["3 kg papa","3 kg cebolla"], emoji:"",
    img:"imagen 2.webp" },
  { id:"fit",      nombre:"Bolsón Frutal", precio:9990,  badge:"Peso: 5 kg",
    items:["Manzana","Banana","Mandarina","Narannja","Frutilla"], emoji:"",
    img:"imagen 3.webp" },
  { id:"asados",   nombre:"Maple de Huevo (30)", precio:6000,  badge:"Peso: 1.5 kg",
    items:["Huevo de Campo"], emoji:"",
    img:"imagen 4.webp" },
];

/* ====== Refs DOM ====== */
const form = $("#orderForm");
const nombre = $("#nombre");
const ubicacion = $("#ubicacion");
const bolson = $("#bolson");   // MULTISELECT
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

/* ====== Modal ====== */
const productPicker = $("#productPicker");
const openPickerBtn = $("#openPicker");
const pickerList = $("#pickerList");
const pickerTotal = $("#pickerTotal");
const pickerConfirm = $("#pickerConfirm");
const pickerCancel = $("#pickerCancel");

/* ========= CARRUSEL ========= */
const getItemsPerView = () => (window.innerWidth < 768 ? 1 : 4);
let itemsPerView = getItemsPerView();
let startIndex = 0;

/* ↓ Nuevo: control de animación y preferencia de movimiento */
let isAnimating = false;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Accesibilidad de navegación */
let lastNavViaKeyboard = false;
const markKeyboardNav = (e) => { if (e.key === "Enter" || e.key === " ") lastNavViaKeyboard = true; };
prevBtn?.addEventListener("keydown", markKeyboardNav);
nextBtn?.addEventListener("keydown", markKeyboardNav);
prevBtn?.addEventListener("mousedown", () => lastNavViaKeyboard = false);
nextBtn?.addEventListener("mousedown", () => lastNavViaKeyboard = false);

/* Lazy load background */
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

/* ====== Render productos (catálogo) ====== */
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
          <button class="btn mini js-elegir" type="button" data-pick="${p.id}">Elegir</button>
        </div>
      </div>
    `;

    productsGrid.appendChild(article);
    observeCardBg(article);
  }

  // Botón "Elegir" → abre el modal y preselecciona ese producto
  $$(".js-elegir", productsGrid).forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-pick");
      openPicker(id);
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

/* ====== Cambio de página instantáneo (desktop) ====== */
const nextPage = () => { startIndex = (startIndex + itemsPerView) % PRODUCTS.length; renderPage(); };
const prevPage = () => { startIndex = (startIndex - itemsPerView + PRODUCTS.length * 10) % PRODUCTS.length; renderPage(); };

/* ====== Slide suave en móviles ====== */
const slideTo = (dir /* 'next' | 'prev' */) => {
  // Si no es móvil (>=2 ítems) o el usuario prefiere menos movimiento → salto directo
  if (itemsPerView !== 1 || prefersReducedMotion) {
    if (dir === 'next') nextPage(); else prevPage();
    return;
  }
  if (isAnimating) return;
  isAnimating = true;

  const outClass = (dir === 'next') ? 'anim-out-left' : 'anim-out-right';
  const inClass  = (dir === 'next') ? 'anim-in-right' : 'anim-in-left';

  // 1) salida
  productsGrid.classList.add(outClass);

  const onOutEnd = () => {
    productsGrid.removeEventListener('animationend', onOutEnd);
    productsGrid.classList.remove(outClass);

    // 2) cambiar contenido “fuera de escena”
    if (dir === 'next') {
      startIndex = (startIndex + itemsPerView) % PRODUCTS.length;
    } else {
      startIndex = (startIndex - itemsPerView + PRODUCTS.length * 10) % PRODUCTS.length;
    }
    renderPage();

    // 3) entrada
    productsGrid.classList.add(inClass);
    const onInEnd = () => {
      productsGrid.removeEventListener('animationend', onInEnd);
      productsGrid.classList.remove(inClass);
      isAnimating = false;
    };
    productsGrid.addEventListener('animationend', onInEnd, { once: true });
  };

  productsGrid.addEventListener('animationend', onOutEnd, { once: true });
};

/* Listeners de flechas:
   - Mobile (1 item): usa slideTo()
   - Desktop (4 items): cambio inmediato */
prevBtn?.addEventListener("click", () => {
  if (itemsPerView === 1 && !prefersReducedMotion) slideTo('prev');
  else prevPage();
});
nextBtn?.addEventListener("click", () => {
  if (itemsPerView === 1 && !prefersReducedMotion) slideTo('next');
  else nextPage();
});

/* ====== Select múltiple del formulario ====== */
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

/* ====== Resumen ====== */
const updateResumen = () => {
  const selected = Array.from(bolson.selectedOptions || []);
  if (!selected.length) {
    resumen.innerHTML = `<strong>Resumen:</strong> Seleccioná al menos un bolsón para ver el total.`;
    return;
  }
  const items = selected.map(o => {
    const nombre = (o.textContent || "").split(" — ")[0] || o.value;
    const precio = Number(o.dataset.precio || 0);
    return { nombre, precio };
  });
  const total = items.reduce((acc, it) => acc + it.precio, 0);
  const lista = items.map(it => `• ${it.nombre} (${formatCurrency(it.precio)})`).join("<br>");
  resumen.innerHTML = `<strong>Resumen:</strong><br>${lista}<br><strong>Total:</strong> ${formatCurrency(total)}`;
};
bolson.addEventListener("change", updateResumen);

/* ====== Modal lógica ====== */
const ensurePickerList = () => {
  if (pickerList.children.length) return;
  PRODUCTS.forEach(p => {
    const row = document.createElement("label");
    row.className = "picker-item";
    row.innerHTML = `
      <input type="checkbox" class="picker-check" value="${p.id}">
      <span class="picker-name">${p.nombre}</span>
      <span class="picker-price">${formatCurrency(p.precio)}</span>
    `;
    pickerList.appendChild(row);
  });
};

const syncPickerFromSelect = (extraToCheckId = null) => {
  const selectedIds = new Set(Array.from(bolson.selectedOptions).map(o => o.value));
  $$(".picker-check", pickerList).forEach(chk => {
    chk.checked = selectedIds.has(chk.value);
    if (extraToCheckId && chk.value === extraToCheckId) chk.checked = true;
  });
  updatePickerTotal();
};

const updatePickerTotal = () => {
  const ids = $$(".picker-check", pickerList).filter(c => c.checked).map(c => c.value);
  const total = PRODUCTS.filter(p => ids.includes(p.id)).reduce((acc, p) => acc + p.precio, 0);
  pickerTotal.textContent = formatCurrency(total);
};

pickerList.addEventListener("change", updatePickerTotal);

const applyPickerToSelect = () => {
  const ids = $$(".picker-check", pickerList).filter(c => c.checked).map(c => c.value);
  Array.from(bolson.options).forEach(o => { o.selected = ids.includes(o.value); });
  bolson.dispatchEvent(new Event("change"));
};

const openPicker = (preselectId = null) => {
  ensurePickerList();
  syncPickerFromSelect(preselectId);
  if (typeof productPicker.showModal === "function") productPicker.showModal();
  else productPicker.setAttribute("open", "");
};

openPickerBtn?.addEventListener("click", () => openPicker());
pickerConfirm?.addEventListener("click", (e) => { e.preventDefault(); applyPickerToSelect(); productPicker.close(); });
pickerCancel?.addEventListener("click", (e) => { e.preventDefault(); productPicker.close(); });

/* ====== Validación ====== */
const requiredFields = [
  { el: nombre, wrap: "#f-nombre", msg: "Ingresá tu nombre." },
  { el: pago,   wrap: "#f-pago",   msg: "Elegí una forma de pago." },
];

const ubicacionIsProvided = () => {
  const lat = (latInput.value || "").trim();
  const lng = (lngInput.value || "").trim();
  const hasCoords = lat && lng;
  const hasText = (ubicacion.value || "").trim().length > 0;
  return hasCoords || hasText;
};
const hasAtLeastOnePack = () => (bolson && bolson.selectedOptions && bolson.selectedOptions.length > 0);

const clearInvalid = () => {
  requiredFields.forEach(({ wrap }) => $(wrap)?.classList.remove("invalid"));
  $("#f-ubicacion")?.classList.remove("invalid");
  $("#f-bolson")?.classList.remove("invalid");
  formStatus.textContent = "";
};
const validate = () => {
  clearInvalid();
  let valid = true;

  requiredFields.forEach(({ el, wrap, msg }) => {
    const value = (el.value || "").trim();
    if (!value) {
      $(wrap)?.classList.add("invalid");
      $(wrap + " .error").textContent = msg;
      valid = false;
    }
  });

  if (!hasAtLeastOnePack()) {
    $("#f-bolson")?.classList.add("invalid");
    $("#f-bolson .error").textContent = "Seleccioná al menos un bolsón.";
    valid = false;
  }

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

/* ====== Maps / Mensajes ====== */
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

const buildOrderLines = () => {
  const selected = Array.from(bolson.selectedOptions || []);
  if (!selected.length) return { lines: ["• Bolsones: (ninguno)"], total: 0 };

  const items = selected.map(o => {
    const nombre = (o.textContent || "").split(" — ")[0] || o.value;
    const precio = Number(o.dataset.precio || 0);
    return { nombre, precio };
  });
  const total = items.reduce((acc, it) => acc + it.precio, 0);
  const lines = items.map(it => `• ${it.nombre}: ${formatCurrency(it.precio)}`);
  lines.push(`• Total: ${formatCurrency(total)}`);
  return { lines, total };
};

const buildMessage = () => {
  const maps = buildMapsLinks();
  const packs = buildOrderLines();
  const lines = [
    "¡Hola! Quiero hacer un pedido 🙌",
    `• Nombre: ${nombre.value.trim()}`,
    `• Ubicación: ${maps.label || "No especificada"}`,
    ...packs.lines,
    `• Forma de pago: ${pago.value}`,
  ];
  if (maps.view) lines.push(`• Google Maps: ${maps.view}`);
  if (comentarios.value.trim()) lines.push(`• Comentarios: ${comentarios.value.trim()}`);
  return lines.join("\n");
};

/* ====== Envíos ====== */
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

/* ====== Interacciones ====== */
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

/* ====== Geolocalización ====== */
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

/* ====== Init ====== */
const populateSelectAndInit = () => {
  populateSelect();
  updateResumen();
  itemsPerView = getItemsPerView();
  renderPage();
};
populateSelectAndInit();
