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

/* ====== Catálogo (imágenes locales) ====== */
const PRODUCTS = [
  { id:"clasico",  nombre:"Bolsón De Verduras", precio:7990,  badge:"Peso: 9 kg",
    items:["Zanahoria","Cebolla de verdeo","Puerro","Acelga","Pimientos rojo y verde","Batata"], emoji:"",
    img:"imagen uno.webp" },
  { id:"familiar", nombre:"Bolsón de Papa y Cebolla", precio:12990, badge:"Peso: 6 kg",
    items:["3 kg papa","3 kg cebolla"], emoji:"",
    img:"imagen 2.webp" },
  { id:"fit",      nombre:"Bolsón Frutal", precio:9990,  badge:"Peso: 5 kg",
    items:["Manzana","Banana","Mandarina","Naranja","Frutilla","Uvas"], emoji:"",
    img:"imagen 3.webp" },
  { id:"asados",   nombre:"Maple de Huevo (30)", precio:6000,  badge:"Peso: 1.5 kg",
    items:["Huevo de Campo"], emoji:"",
    img:"imagen 4.webp" },
];

/* ====== Estado de cantidades (carrito) ====== */
const cart = Object.fromEntries(PRODUCTS.map(p => [p.id, 0]));
const getProductById = (id) => PRODUCTS.find(p => p.id === id);
const getPrice = (id) => getProductById(id)?.precio ?? 0;
const getName = (id) => getProductById(id)?.nombre ?? id;
const getCartTotal = () => Object.entries(cart).reduce((sum, [id, q]) => sum + q * getPrice(id), 0);
const getCartItems = () => Object.entries(cart).filter(([,q]) => q>0).map(([id,q]) => ({ id, qty:q, nombre:getName(id), precio:getPrice(id), subtotal:q*getPrice(id) }));

/* ====== Refs DOM ====== */
const form = $("#orderForm");
const nombre = $("#nombre");
const ubicacion = $("#ubicacion");
const bolson = $("#bolson");   // MULTISELECT (interno / compat)
const pago = $("#pago");
const comentarios = $("#comentarios");
const resumen = $("#resumen");
const formStatus = $("#formStatus");
// Removed duplicate declaration of selectedDetails

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
/* Botón “Elegir” eliminado como pediste: sólo mostramos precio */
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
        </div>
      </div>
    `;

    productsGrid.appendChild(article);
    observeCardBg(article);
  }

  productsGrid.setAttribute("aria-busy", "false");
  productsGrid.focus({ preventScroll: true });
};

const nextPage = () => { startIndex = (startIndex + itemsPerView) % PRODUCTS.length; renderPage(); };
const prevPage = () => { startIndex = (startIndex - itemsPerView + PRODUCTS.length * 10) % PRODUCTS.length; renderPage(); };

const slideTo = (dir) => {
  if (itemsPerView !== 1 || prefersReducedMotion) {
    if (dir === 'next') nextPage(); else prevPage();
    return;
  }
  if (isAnimating) return;
  isAnimating = true;

  const outClass = (dir === 'next') ? 'anim-out-left' : 'anim-out-right';
  const inClass  = (dir === 'next') ? 'anim-in-right' : 'anim-in-left';

  productsGrid.classList.add(outClass);

  const onOutEnd = () => {
    productsGrid.removeEventListener('animationend', onOutEnd);
    productsGrid.classList.remove(outClass);

    if (dir === 'next') {
      startIndex = (startIndex + itemsPerView) % PRODUCTS.length;
    } else {
      startIndex = (startIndex - itemsPerView + PRODUCTS.length * 10) % PRODUCTS.length;
    }
    renderPage();

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

prevBtn?.addEventListener("click", () => {
  if (itemsPerView === 1 && !prefersReducedMotion) slideTo('prev');
  else prevPage();
});
nextBtn?.addEventListener("click", () => {
  if (itemsPerView === 1 && !prefersReducedMotion) slideTo('next');
  else nextPage();
});

/* ====== Select múltiple (compat) ====== */
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

/* ====== Detalle dinámico de seleccionados (usa cart) ====== */
const selectedDetails = $("#selectedDetails");
const renderSelectedDetails = () => {
  if (!selectedDetails) return;
  const items = getCartItems();
  if (!items.length) {
    selectedDetails.innerHTML = "";
    return;
  }
  const html = items.map(({ id, qty }) => {
    const p = getProductById(id);
    const lista = (p.items || []).map(it => `<li>${it}</li>`).join("");
    return `
      <div class="pack-detail" data-pack="${id}">
        <p class="pack-detail-title">${p.nombre} × ${qty}</p>
        <ul class="pack-detail-list">${lista}</ul>
      </div>
    `;
  }).join("");
  selectedDetails.innerHTML = html;
};

/* ====== Resumen (usa cart) ====== */
const updateResumen = () => {
  const items = getCartItems();
  if (!items.length) {
    resumen.innerHTML = `<strong>Resumen:</strong> Seleccioná al menos un bolsón para ver el total.`;
    syncSelectFromCart();
    renderSelectedDetails();
    return;
  }

  const lista = items
    .map(it => `• ${it.nombre} × ${it.qty} = ${formatCurrency(it.subtotal)}`)
    .join("<br>");
  const total = items.reduce((acc, it) => acc + it.subtotal, 0);

  resumen.innerHTML = `<strong>Resumen:</strong><br>${lista}<br><strong>Total:</strong> ${formatCurrency(total)}`;
  syncSelectFromCart();
  renderSelectedDetails();
};

const syncSelectFromCart = () => {
  const selectedIds = Object.entries(cart).filter(([,q]) => q>0).map(([id]) => id);
  Array.from(bolson.options).forEach(o => { o.selected = selectedIds.includes(o.value); });
  bolson.dispatchEvent(new Event("change"));
};

/* ====== Modal con cantidades ====== */
const clampQty = (n) => Math.max(0, Number.isFinite(n) ? Math.floor(n) : 0);

const renderPickerList = () => {
  pickerList.innerHTML = "";
  PRODUCTS.forEach(p => {
    const row = document.createElement("div");
    row.className = "picker-item";
    row.dataset.id = p.id;

    const desc = (p.items || []).map(it => `<li>${it}</li>`).join("");

    /* NUEVO: agregamos el peso debajo del precio con .picker-weight */
    row.innerHTML = `
      <div class="picker-left">
        <span class="picker-name">${p.nombre}</span>
        <span class="picker-price">${formatCurrency(p.precio)}</span>
        <span class="picker-weight">${p.badge}</span>
        <ul class="picker-desc">${desc}</ul>
      </div>
      <div class="picker-right">
        <div class="qty">
          <button type="button" class="qty-btn js-dec" aria-label="Disminuir ${p.nombre}">–</button>
          <input class="qty-input js-qty" inputmode="numeric" pattern="[0-9]*" min="0" value="${cart[p.id] ?? 0}">
          <button type="button" class="qty-btn js-inc" aria-label="Aumentar ${p.nombre}">+</button>
        </div>
        <div class="row-total js-row-total">${formatCurrency((cart[p.id] ?? 0) * p.precio)}</div>
      </div>
    `;
    pickerList.appendChild(row);
  });
  recalcPickerTotals();
};

const writeRowQty = (row, q) => { $(".js-qty", row).value = String(clampQty(q)); };
const writeRowTotal = (row, id) => { $(".js-row-total", row).textContent = formatCurrency(cart[id] * getPrice(id)); };
const recalcPickerTotals = () => { pickerTotal.textContent = formatCurrency(getCartTotal()); };

pickerList.addEventListener("click", (e) => {
  const btn = e.target.closest(".qty-btn");
  if (!btn) return;
  const row = e.target.closest(".picker-item");
  const id = row.dataset.id;
  const isInc = btn.classList.contains("js-inc");

  const current = cart[id] ?? 0;
  const next = clampQty(isInc ? current + 1 : current - 1);
  cart[id] = next;

  writeRowQty(row, next);
  writeRowTotal(row, id);
  recalcPickerTotals();
});

pickerList.addEventListener("input", (e) => {
  if (!e.target.classList.contains("js-qty")) return;
  const row = e.target.closest(".picker-item");
  const id = row.dataset.id;
  const q = clampQty(parseInt(e.target.value, 10));
  cart[id] = q;
  writeRowQty(row, q);
  writeRowTotal(row, id);
  recalcPickerTotals();
});

const openPicker = () => {
  renderPickerList();
  if (typeof productPicker.showModal === "function") productPicker.showModal();
  else productPicker.setAttribute("open", "");
  document.body.classList.add("no-scroll"); // bloquear scroll de fondo
};

pickerConfirm?.addEventListener("click", (e) => {
  e.preventDefault();
  productPicker.close();
  updateResumen();
});
pickerCancel?.addEventListener("click", (e) => {
  e.preventDefault();
  productPicker.close();
});

productPicker?.addEventListener("close", () => {
  document.body.classList.remove("no-scroll");
  updateResumen();
});
openPickerBtn?.addEventListener("click", openPicker);

/* ====== Validación ====== */
const requiredFields = [
  { el: nombre, wrap: "#f-nombre", msg: "Ingresá tu nombre." },
  { el: pago,   wrap: "#f-pago",   msg: "Elegí una forma de pago." },
];

const ubicacionIsProvided = () => {
  const lat = (latInput?.value || "").trim();
  const lng = (lngInput?.value || "").trim();
  const hasCoords = lat && lng;
  const hasText = (ubicacion.value || "").trim().length > 0;
  return hasCoords || hasText;
};
const hasAtLeastOnePack = () => getCartItems().length > 0;

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

/* ====== Maps / Mensajes (usa cart) ====== */
const buildMapsLinks = () => {
  const lat = (latInput?.value || "").trim();
  const lng = (lngInput?.value || "").trim();
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
  const items = getCartItems();
  if (!items.length) return { lines: ["• Bolsones: (ninguno)"], total: 0 };

  const lines = items.map(it => `• ${it.nombre} × ${it.qty}: ${formatCurrency(it.subtotal)}`);
  const total = items.reduce((acc, it) => acc + it.subtotal, 0);
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

/* ====== Interacciones ====== */
[...[nombre, ubicacion, bolson, pago, comentarios]].forEach(el => {
  el?.addEventListener("input", clearInvalid);
  el?.addEventListener("change", clearInvalid);
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

/* ====== Resize / Init ====== */
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

const populateSelectAndInit = () => {
  populateSelect();
  updateResumen();
  itemsPerView = getItemsPerView();
  renderPage();
};
populateSelectAndInit();
