/* =====================================================================
   AK.FASHION — SITE SCRIPT
   =====================================================================
   THE ONE SETTING YOU MUST CHANGE:
   Set your real WhatsApp number below (country code, no spaces,
   no "+", no leading 0). Example for a Pakistani number
   0300 1234567 -> "923001234567"
   ===================================================================== */
const WHATSAPP_NUMBER = "923037252700"; // <-- replace with your real number

const CURRENCY_PREFIX = "Rs "; // change to "$" etc. if you sell elsewhere

/* --------------------------------------------------------------
   Helpers
   -------------------------------------------------------------- */
function formatPrice(n){
  return CURRENCY_PREFIX + n.toLocaleString("en-PK");
}

// Fine-pointer (mouse/trackpad) + no reduced-motion preference — gates the
// hover-tilt effects so touch devices and accessibility settings are respected.
const supportsFineTilt =
  window.matchMedia("(pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------
   TOAST — small confirmation bubble after adding to bag
   -------------------------------------------------------------- */
let toastTimer = null;
function showToast(message){
  const toast = document.getElementById("toast");
  if(!toast) return;
  toast.textContent = message;
  toast.classList.remove("show");
  void toast.offsetWidth; // restart transition
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* --------------------------------------------------------------
   LIVE CLOCK — hands rotate around the dial center of the hero
   watch drawn directly in index.html's SVG. The pivot (240, 150)
   is that dial's exact center in the SVG's own viewBox coordinates,
   so this doesn't depend on any photo at all — it's a real,
   ticking illustration.
   -------------------------------------------------------------- */
const CLOCK_PIVOT = { x: 320, y: 190 };

/* --------------------------------------------------------------
   HERO STAT COUNTERS — numbers count up from 0 on load instead
   of just appearing flat.
   -------------------------------------------------------------- */
function animateCount(el){
  const target = parseFloat(el.dataset.countTo);
  const decimals = parseInt(el.dataset.decimal || "0", 10);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if(reduceMotion || Number.isNaN(target)){
    el.textContent = decimals ? target.toFixed(decimals) : Math.round(target).toLocaleString("en-US");
    return;
  }

  const duration = 1400;
  const start = performance.now();

  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = target * eased;
    el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");
    if(progress < 1) requestAnimationFrame(tick);
    else el.textContent = decimals ? target.toFixed(decimals) : Math.round(target).toLocaleString("en-US");
  }
  requestAnimationFrame(tick);
}

function initStatCounters(){
  document.querySelectorAll(".count[data-count-to]").forEach(animateCount);
}

/* --------------------------------------------------------------
   HERO WATCH — subtle mouse-parallax tilt on the signature watch,
   layered on top of its own CSS sway/bob animation.
   -------------------------------------------------------------- */
function initHeroWatchTilt(){
  const wrap = document.querySelector(".hero-watch-wrap");
  const tiltEl = document.getElementById("heroWatchTilt");
  if(!wrap || !tiltEl || !supportsFineTilt) return;

  wrap.addEventListener("mousemove", (e) => {
    const rect = wrap.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 10;
    tiltEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  wrap.addEventListener("mouseleave", () => {
    tiltEl.style.transform = "";
  });
}

function tickClock(){
  const now = new Date();
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  const secondDeg = (s + ms/1000) * 6;
  const minuteDeg = (m + s/60) * 6;
  const hourDeg = (h + m/60) * 30;

  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const secondHand = document.getElementById("secondHand");
  const { x, y } = CLOCK_PIVOT;
  if(hourHand)   hourHand.setAttribute("transform",   `rotate(${hourDeg} ${x} ${y})`);
  if(minuteHand) minuteHand.setAttribute("transform", `rotate(${minuteDeg} ${x} ${y})`);
  if(secondHand) secondHand.setAttribute("transform", `rotate(${secondDeg} ${x} ${y})`);

  requestAnimationFrame(tickClock);
}

/* --------------------------------------------------------------
   CART STATE (persisted in localStorage)
   -------------------------------------------------------------- */
let cart = JSON.parse(localStorage.getItem("akfashion_cart") || "[]");

// Drop any cart lines that point at a product id which no longer exists
// in products.js (e.g. it was renamed/removed). Without this, a stale
// line stays invisible in the drawer (it's filtered out of renderCart)
// but still gets counted on the cart badge — showing a count with an
// apparently-empty bag.
cart = cart.filter(line => PRODUCTS.some(p => p.id === line.id));
localStorage.setItem("akfashion_cart", JSON.stringify(cart));

function saveCart(){
  localStorage.setItem("akfashion_cart", JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function addToCart(productId){
  const existing = cart.find(l => l.id === productId);
  if(existing){ existing.qty += 1; }
  else{ cart.push({ id: productId, qty: 1 }); }
  saveCart();
}

function changeQty(productId, delta){
  const line = cart.find(l => l.id === productId);
  if(!line) return;
  line.qty += delta;
  if(line.qty <= 0){ cart = cart.filter(l => l.id !== productId); }
  saveCart();
}

function removeFromCart(productId){
  cart = cart.filter(l => l.id !== productId);
  saveCart();
}

function cartTotal(){
  return cart.reduce((sum, line) => {
    const product = PRODUCTS.find(p => p.id === line.id);
    return product ? sum + product.price * line.qty : sum;
  }, 0);
}

function updateCartCount(){
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const el = document.getElementById("cartCount");
  if(!el) return;
  el.textContent = count;
  el.classList.remove("bump");
  // restart the animation on every change
  void el.offsetWidth;
  el.classList.add("bump");
}

/* --------------------------------------------------------------
   FILTER STATE — which category chip is active + current search text
   -------------------------------------------------------------- */
let activeCategory = "All";
let searchTerm = "";

function filteredProducts(){
  return PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm) || (p.description || "").toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
}

function renderCategoryChips(){
  const strip = document.getElementById("catStrip");
  if(!strip) return;
  const cats = ["All", ...CATEGORIES];
  strip.innerHTML = cats.map(c => `
    <button class="cat-chip${c === activeCategory ? " active" : ""}" data-cat="${c}" role="tab" aria-selected="${c === activeCategory}">${c}</button>
  `).join("");
  strip.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderCategoryChips();
      renderProducts();
    });
  });
}

/* --------------------------------------------------------------
   RENDER: product grid
   -------------------------------------------------------------- */
function renderProducts(){
  const grid = document.getElementById("productGrid");
  if(!grid) return;
  const list = filteredProducts();

  const resultsCount = document.getElementById("resultsCount");
  if(resultsCount){
    resultsCount.textContent = `${list.length} ${list.length === 1 ? "piece" : "pieces"}`;
  }

  if(list.length === 0){
    grid.innerHTML = `<p class="no-results">No pieces match that search — try another term or category.</p>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => `
    <article class="product-card reveal in-view" data-id="${p.id}" style="transition-delay:${Math.min(i,5) * 90}ms">
      <div class="product-media" data-open-qv="${p.id}" data-active-photo="1">
        ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ""}
        <img src="${p.photo1}" alt="${p.name} — front view" class="photo-1" loading="lazy">
        <img src="${p.photo2}" alt="${p.name} — alternate view" class="photo-2" loading="lazy">
        <span class="media-hover-badge">Tap to view details</span>
        <div class="media-dots" data-dots="${p.id}">
          <button class="media-dot active" data-dot="1" aria-label="Show front view"></button>
          <button class="media-dot" data-dot="2" aria-label="Show alternate view"></button>
        </div>
        ${p.video ? `
        <button class="video-toggle" data-video-toggle="${p.id}" aria-label="Play product video">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="product-video-layer" data-video-layer="${p.id}">
          <button class="video-close" data-video-close="${p.id}" aria-label="Close video">&times;</button>
          <video src="${p.video}" controls playsinline></video>
        </div>` : `
        <button class="video-toggle" data-video-toggle="${p.id}" aria-label="Product video">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="product-video-layer" data-video-layer="${p.id}">
          <button class="video-close" data-video-close="${p.id}" aria-label="Close video">&times;</button>
          <div class="video-placeholder">Product video coming soon.<br>Add a "video" path in products.js.</div>
        </div>`}
      </div>
      <div class="product-info" data-open-qv="${p.id}">
        <span class="product-cat">${p.category || ""}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || ""}</p>
        <div class="product-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          <button class="add-cart-btn" data-add="${p.id}">Add to Bag</button>
        </div>
        <button class="buy-now-btn" data-buy="${p.id}">Buy Now</button>
        <button class="wa-checkout-btn" data-wa="${p.id}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2.05 22l5.36-1.4a9.9 9.9 0 0 0 4.63 1.18h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.18.83.85-3.1-.2-.32a8.22 8.22 0 0 1-1.26-4.4c0-4.55 3.71-8.26 8.28-8.26 2.21 0 4.29.86 5.85 2.43a8.2 8.2 0 0 1 2.42 5.84c0 4.56-3.71 8.26-8.26 8.26Zm4.53-6.19c-.25-.12-1.47-.72-1.7-.8-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.96-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.08s.9 2.41 1.02 2.58c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.42 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z"/></svg>
          Checkout via WhatsApp
        </button>
      </div>
    </article>
  `).join("");

  // Clicking the photo or the text opens quick view; the Add to Bag
  // button, video controls, and photo dots stop their own click from
  // bubbling up to this.
  grid.querySelectorAll("[data-open-qv]").forEach(el => {
    el.addEventListener("click", (e) => {
      if(e.target.closest("[data-add]") || e.target.closest("[data-wa]") || e.target.closest("[data-video-toggle]") || e.target.closest("[data-video-close]") || e.target.closest(".product-video-layer") || e.target.closest("[data-dot]")) return;
      openQuickView(el.dataset.openQv);
    });
  });

  // Checkout via WhatsApp — straight from the card, no need to add to bag first
  grid.querySelectorAll("[data-wa]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      goToProductWhatsapp(btn.dataset.wa);
    });
  });

  // Buy Now — opens the checkout form prefilled with this product
  grid.querySelectorAll("[data-buy]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openBuyNowForm(btn.dataset.buy, 1);
    });
  });

  // Photo dots — lets anyone (not just mouse-hover users) flip between
  // a product's two shots directly on the card.
  grid.querySelectorAll(".product-media").forEach(media => {
    media.querySelectorAll("[data-dot]").forEach(dot => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const which = dot.dataset.dot;
        media.dataset.activePhoto = which;
        media.querySelectorAll("[data-dot]").forEach(d => d.classList.toggle("active", d.dataset.dot === which));
        media.classList.toggle("show-photo-2", which === "2");
      });
    });
  });

  // Add-to-cart buttons
  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.add);
      btn.textContent = "Added ✓";
      btn.classList.add("added");
      setTimeout(() => { btn.textContent = "Add to Bag"; btn.classList.remove("added"); }, 1200);

      const addedProduct = PRODUCTS.find(p => p.id === btn.dataset.add);
      if(addedProduct) showToast(`${addedProduct.name} added to bag`);

      const cartBtn = document.getElementById("cartToggle");
      cartBtn.classList.remove("bump-parent");
      void cartBtn.offsetWidth;
      cartBtn.classList.add("bump-parent");

      setTimeout(openCart, 200); // let the soft pop play before the drawer glides in
    });
  });

  // Subtle 3D tilt that follows the cursor — desktop/mouse only
  if(supportsFineTilt){
    grid.querySelectorAll(".product-card").forEach(card => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 8;
        const rotateX = (0.5 - py) * 8;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.015)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  // Video toggles
  grid.querySelectorAll("[data-video-toggle]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.videoToggle;
      document.querySelector(`[data-video-layer="${id}"]`).classList.add("active");
    });
  });
  grid.querySelectorAll("[data-video-close]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.videoClose;
      const layer = document.querySelector(`[data-video-layer="${id}"]`);
      layer.classList.remove("active");
      const video = layer.querySelector("video");
      if(video) video.pause();
    });
  });
}

/* --------------------------------------------------------------
   QUICK VIEW — opens a product "in its own window" (a focused
   modal) with full details, plus a suggestions row of other items.
   -------------------------------------------------------------- */
let qvCurrentId = null;
let qvQty = 1;
let qvImages = [];
let qvIndex = 0;

function qvImagesFor(p){
  // Supports products that only define photo1/photo2 today, but will
  // also pick up a "gallery" array of extra shots if you add one later.
  const list = [p.photo1, p.photo2, ...(Array.isArray(p.gallery) ? p.gallery : [])];
  return list.filter(Boolean);
}

function setQvImage(index){
  if(qvImages.length === 0) return;
  qvIndex = (index + qvImages.length) % qvImages.length;
  const imgEl = document.getElementById("qvImage");
  imgEl.style.opacity = 0;
  setTimeout(() => {
    imgEl.src = qvImages[qvIndex];
    imgEl.style.opacity = 1;
  }, 160);

  document.querySelectorAll("#qvThumbs .qv-thumb").forEach((t, i) => {
    t.classList.toggle("active", i === qvIndex);
  });
}

function renderQvThumbs(){
  const wrap = document.getElementById("qvThumbs");
  if(qvImages.length <= 1){ wrap.innerHTML = ""; wrap.style.display = "none"; return; }
  wrap.style.display = "flex";
  wrap.innerHTML = qvImages.map((src, i) => `
    <button class="qv-thumb${i === qvIndex ? " active" : ""}" data-thumb="${i}">
      <img src="${src}" alt="View ${i + 1}">
    </button>
  `).join("");
  wrap.querySelectorAll("[data-thumb]").forEach(btn => {
    btn.addEventListener("click", () => setQvImage(Number(btn.dataset.thumb)));
  });
}

function openQvVideo(){
  const p = PRODUCTS.find(pr => pr.id === qvCurrentId);
  if(!p || !p.video) return;
  const video = document.getElementById("qvVideo");
  video.src = p.video;
  document.getElementById("qvVideoWrap").classList.add("active");
  video.play().catch(() => {}); // autoplay may be blocked until the user taps controls — that's fine
}

function closeQvVideo(){
  const video = document.getElementById("qvVideo");
  video.pause();
  document.getElementById("qvVideoWrap").classList.remove("active");
}

function openQuickView(productId, options = {}){
  const { pushHistory = true } = options;
  const p = PRODUCTS.find(pr => pr.id === productId);
  if(!p) return;
  qvCurrentId = productId;
  qvQty = 1;
  qvImages = qvImagesFor(p);
  qvIndex = 0;
  closeQvVideo();

  const imgEl = document.getElementById("qvImage");
  imgEl.style.opacity = 1;
  imgEl.src = qvImages[0] || "";
  imgEl.alt = p.name;
  document.getElementById("qvName").textContent = p.name;
  document.getElementById("qvPrice").textContent = formatPrice(p.price);
  document.getElementById("qvDesc").textContent = p.description || "";
  document.getElementById("qvQtyVal").textContent = qvQty;

  const tagEl = document.getElementById("qvTag");
  if(p.tag){ tagEl.textContent = p.tag; tagEl.style.display = "inline-block"; }
  else{ tagEl.style.display = "none"; }

  const hasMultipleImages = qvImages.length > 1;
  document.getElementById("qvPrev").style.display = hasMultipleImages ? "flex" : "none";
  document.getElementById("qvNext").style.display = hasMultipleImages ? "flex" : "none";
  renderQvThumbs();

  const videoBtn = document.getElementById("qvVideoBtn");
  videoBtn.style.display = p.video ? "flex" : "none";

  // wire the WhatsApp button up for whichever product is currently open,
  // so it always sends the on-screen quantity + this product's details
  const qvWaBtn = document.getElementById("qvWaBtn");
  if(qvWaBtn) qvWaBtn.onclick = () => goToProductWhatsapp(qvCurrentId, qvQty);

  // wire Buy Now the same way — always opens the form for whichever
  // product + quantity is currently on screen
  const qvBuyBtn = document.getElementById("qvBuyBtn");
  if(qvBuyBtn) qvBuyBtn.onclick = () => openBuyNowForm(qvCurrentId, qvQty);

  renderQvSuggestions(productId);

  // Swap the homepage out for a real, standalone product page — not a
  // popup card — and update the browser's address bar/history so the
  // back button (and reloading/sharing the link) both work naturally.
  document.getElementById("mainView").hidden = true;
  document.getElementById("productView").hidden = false;
  document.title = `${p.name} — AK.Fashion`;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  if(pushHistory){
    history.pushState({ productId }, "", `#product/${productId}`);
  }
}

function closeQuickView(options = {}){
  const { pushHistory = true } = options;
  document.getElementById("productView").hidden = true;
  document.getElementById("mainView").hidden = false;
  document.title = "AK.Fashion — Luxury Watches";
  closeQvVideo();

  if(pushHistory && location.hash.startsWith("#product/")){
    history.pushState({}, "", location.pathname + location.search);
  }
}

function renderQvSuggestions(excludeId){
  const row = document.getElementById("qvSuggestions");
  // Prefer other watches first (this is a watch-led catalog), then top
  // up with any other category so the list is never emptier than it
  // needs to be.
  const watches = PRODUCTS.filter(p => p.id !== excludeId && p.category === "Watches");
  const others = PRODUCTS.filter(p => p.id !== excludeId && p.category !== "Watches");
  const list = [...watches, ...others].slice(0, 8);

  row.innerHTML = list.map(p => `
    <button class="qv-suggestion" data-suggest="${p.id}">
      <img src="${p.photo1}" alt="${p.name}">
      <span class="qv-suggestion-name">${p.name}</span>
      <span class="qv-suggestion-price">${formatPrice(p.price)}</span>
    </button>
  `).join("");
  row.querySelectorAll("[data-suggest]").forEach(btn => {
    btn.addEventListener("click", () => openQuickView(btn.dataset.suggest));
  });
}

function initQuickView(){
  document.getElementById("qvBack").addEventListener("click", () => closeQuickView());
  document.addEventListener("keydown", (e) => {
    if(document.getElementById("productView").hidden) return;
    if(e.key === "Escape") closeQuickView();
    if(e.key === "ArrowLeft") setQvImage(qvIndex - 1);
    if(e.key === "ArrowRight") setQvImage(qvIndex + 1);
  });

  // Browser back/forward: keep the product page in sync with the URL
  // instead of just closing blindly, so forward-navigation and deep
  // links both behave like a real page.
  window.addEventListener("popstate", () => {
    const match = location.hash.match(/^#product\/(.+)$/);
    if(match && PRODUCTS.some(p => p.id === match[1])){
      openQuickView(match[1], { pushHistory: false });
    } else {
      closeQuickView({ pushHistory: false });
    }
  });

  document.getElementById("qvPrev").addEventListener("click", () => setQvImage(qvIndex - 1));
  document.getElementById("qvNext").addEventListener("click", () => setQvImage(qvIndex + 1));
  document.getElementById("qvVideoBtn").addEventListener("click", openQvVideo);
  document.getElementById("qvVideoClose").addEventListener("click", closeQvVideo);

  document.getElementById("qvMinus").addEventListener("click", () => {
    qvQty = Math.max(1, qvQty - 1);
    document.getElementById("qvQtyVal").textContent = qvQty;
  });
  document.getElementById("qvPlus").addEventListener("click", () => {
    qvQty += 1;
    document.getElementById("qvQtyVal").textContent = qvQty;
  });

  document.getElementById("qvAddBtn").addEventListener("click", () => {
    if(!qvCurrentId) return;
    for(let i = 0; i < qvQty; i++) addToCart(qvCurrentId);
    const btn = document.getElementById("qvAddBtn");
    const original = btn.textContent;
    btn.textContent = "Added ✓";
    btn.classList.add("added");
    setTimeout(() => { btn.textContent = original; btn.classList.remove("added"); }, 1000);

    const addedProduct = PRODUCTS.find(p => p.id === qvCurrentId);
    if(addedProduct) showToast(`${addedProduct.name} added to bag`);

    setTimeout(() => { closeQuickView(); openCart(); }, 350);
  });

  // Deep link on first load: if the page was opened (or refreshed) on
  // a #product/<id> URL, go straight to that product page.
  const initialMatch = location.hash.match(/^#product\/(.+)$/);
  if(initialMatch && PRODUCTS.some(p => p.id === initialMatch[1])){
    openQuickView(initialMatch[1], { pushHistory: false });
  }
}

/* --------------------------------------------------------------
   RENDER: cart drawer
   -------------------------------------------------------------- */
function renderCart(){
  const wrap = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const emptyNote = document.getElementById("cartEmptyNote");
  const checkoutBtn = document.getElementById("checkoutBtn");
  if(!wrap) return;

  if(cart.length === 0){
    wrap.innerHTML = "";
    emptyNote.style.display = "block";
    checkoutBtn.style.display = "none";
  } else {
    emptyNote.style.display = "none";
    checkoutBtn.style.display = "flex";
    wrap.innerHTML = cart.map(line => {
      const p = PRODUCTS.find(pr => pr.id === line.id);
      if(!p) return "";
      return `
        <div class="cart-line">
          <img src="${p.photo1}" alt="${p.name}">
          <div class="cart-line-info">
            <div class="cart-line-name">${p.name}</div>
            <div class="cart-line-price">${formatPrice(p.price)}</div>
            <div class="qty-control">
              <button data-qty-minus="${p.id}">−</button>
              <span>${line.qty}</span>
              <button data-qty-plus="${p.id}">+</button>
              <button class="remove-line" data-remove="${p.id}">Remove</button>
            </div>
          </div>
        </div>`;
    }).join("");

    wrap.querySelectorAll("[data-qty-minus]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.qtyMinus, -1)));
    wrap.querySelectorAll("[data-qty-plus]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.qtyPlus, 1)));
    wrap.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
  }

  totalEl.textContent = formatPrice(cartTotal());
}

/* --------------------------------------------------------------
   CART DRAWER open/close
   -------------------------------------------------------------- */
function openCart(){
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
  // the WhatsApp/scroll-top buttons live bottom-right, same corner as the
  // cart's price + checkout button — shift them aside while cart is open
  document.body.classList.add("cart-open");
}
function closeCart(){
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
  document.body.classList.remove("cart-open");
}

/* --------------------------------------------------------------
   WHATSAPP CHECKOUT — builds an auto-generated order message
   -------------------------------------------------------------- */
function buildWhatsappMessage(){
  let msg = "Hello AK.Fashion! I'd like to order:\n\n";
  cart.forEach(line => {
    const p = PRODUCTS.find(pr => pr.id === line.id);
    if(!p) return;
    msg += `• ${p.name} — Qty ${line.qty} — ${formatPrice(p.price * line.qty)}\n`;
  });
  msg += `\nTotal: ${formatPrice(cartTotal())}`;
  msg += "\n\nPlease confirm availability and delivery details.";
  return msg;
}

function goToWhatsappCheckout(){
  if(cart.length === 0) return;
  const text = encodeURIComponent(buildWhatsappMessage());
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  window.open(url, "_blank", "noopener");
}

/* --------------------------------------------------------------
   WHATSAPP — "Checkout via WhatsApp" on a single product card.
   ------------------------------------------------------------------
   Honest limitation, so nothing here overpromises: WhatsApp's
   click-to-chat links (wa.me / api.whatsapp.com) only let a website
   pre-fill the TEXT of a message — no website is allowed to reach
   into WhatsApp and attach an actual photo/file for the person,
   since that would be a privacy/security hole. There's no public
   link format that does it.

   By design, this message contains only product name, category,
   price, description and delivery request — no image path/URL.
   -------------------------------------------------------------- */
function buildProductWhatsappMessage(p, qty = 1){
  let msg = `Hi AK.Fashion! I'm interested in this piece:\n\n`;
  msg += `*${p.name}*`;
  if(p.tag) msg += ` (${p.tag})`;
  msg += `\n`;
  if(p.category) msg += `Category: ${p.category}\n`;
  msg += `Price: ${formatPrice(p.price)}`;
  if(qty > 1) msg += ` x ${qty} = ${formatPrice(p.price * qty)}`;
  msg += `\n`;
  if(p.description) msg += `${p.description}\n`;
  msg += `\nPlease confirm availability and delivery details.`;
  return msg;
}

function goToProductWhatsapp(productId, qty = 1){
  const p = PRODUCTS.find(pr => pr.id === productId);
  if(!p) return;
  const text = encodeURIComponent(buildProductWhatsappMessage(p, qty));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  window.open(url, "_blank", "noopener");
}

/* --------------------------------------------------------------
   BUY NOW — a one-product checkout form that opens straight from
   a product card or the product page, prefilled with that item's
   name and price. On submit it POSTs to Web3Forms (web3forms.com),
   which emails the completed order to you — no backend needed.

   THE ONE SETTING YOU MUST CHECK:
   Your Web3Forms access key lives on the hidden "access_key" input
   inside the #buyNowForm form in index.html. Get your own free key
   at https://web3forms.com if you ever need to change it.
   -------------------------------------------------------------- */
let buyNowProduct = null;
let buyNowQty = 1;

function updateBuyNowQty(){
  document.getElementById("bnQtyVal").textContent = buyNowQty;
  document.getElementById("bnQtyField").value = buyNowQty;
  if(buyNowProduct){
    document.getElementById("bnTotal").textContent = formatPrice(buyNowProduct.price * buyNowQty);
    document.getElementById("bnTotalField").value = formatPrice(buyNowProduct.price * buyNowQty);
  }
}

function openBuyNowForm(productId, qty = 1){
  const p = PRODUCTS.find(pr => pr.id === productId);
  if(!p) return;
  buyNowProduct = p;
  buyNowQty = Math.max(1, qty);

  const form = document.getElementById("buyNowForm");
  form.reset(); // clear any previous customer's details left in the fields

  document.getElementById("bnProductImg").src = p.photo1;
  document.getElementById("bnProductImg").alt = p.name;
  document.getElementById("bnProductName").textContent = p.name;
  document.getElementById("bnProductPrice").textContent = formatPrice(p.price);

  // reset() above also blanks the hidden product fields, since they're
  // real inputs — set them again right after
  document.getElementById("bnProductField").value = p.name;
  document.getElementById("bnPriceField").value = formatPrice(p.price);
  document.getElementById("bnSubject").value = `New Order — ${p.name}`;
  updateBuyNowQty();

  const statusEl = document.getElementById("bnStatus");
  statusEl.textContent = "";
  statusEl.className = "bn-status";
  const submitBtn = document.getElementById("bnSubmitBtn");
  submitBtn.disabled = false;
  submitBtn.textContent = "Confirm Order";

  document.getElementById("buyNowModal").hidden = false;
  requestAnimationFrame(() => {
    document.getElementById("buyNowOverlay").classList.add("open");
    document.getElementById("buyNowModal").classList.add("open");
  });
  document.body.classList.add("buynow-open");
}

function closeBuyNowForm(){
  document.getElementById("buyNowOverlay").classList.remove("open");
  document.getElementById("buyNowModal").classList.remove("open");
  document.body.classList.remove("buynow-open");
  setTimeout(() => { document.getElementById("buyNowModal").hidden = true; }, 300);
}

// Builds a clean, receipt-style body for the email, on top of the
// individual named fields Web3Forms already sends.
function buildBuyNowReceipt(formData){
  return (
    `ORDER RECEIPT — AK.Fashion\n\n` +
    `Product: ${buyNowProduct.name}\n` +
    `Unit Price: ${formatPrice(buyNowProduct.price)}\n` +
    `Quantity: ${buyNowQty}\n` +
    `Order Total: ${formatPrice(buyNowProduct.price * buyNowQty)}\n\n` +
    `Customer Name: ${formData.get("Full Name")}\n` +
    `Phone: ${formData.get("Phone Number")}\n` +
    `Email: ${formData.get("Email")}\n` +
    `Delivery Address: ${formData.get("Delivery Address")}\n`
  );
}

function initBuyNowForm(){
  document.getElementById("buyNowClose").addEventListener("click", closeBuyNowForm);
  document.getElementById("buyNowOverlay").addEventListener("click", closeBuyNowForm);
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape" && document.getElementById("buyNowModal").classList.contains("open")) closeBuyNowForm();
  });

  document.getElementById("bnMinus").addEventListener("click", () => {
    buyNowQty = Math.max(1, buyNowQty - 1);
    updateBuyNowQty();
  });
  document.getElementById("bnPlus").addEventListener("click", () => {
    buyNowQty += 1;
    updateBuyNowQty();
  });

  document.getElementById("buyNowForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if(!buyNowProduct) return;

    const form = e.target;
    const statusEl = document.getElementById("bnStatus");
    const submitBtn = document.getElementById("bnSubmitBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    statusEl.textContent = "";
    statusEl.className = "bn-status";

    const formData = new FormData(form);
    document.getElementById("bnMessageField").value = buildBuyNowReceipt(formData);
    formData.set("message", document.getElementById("bnMessageField").value);

    try{
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData
      });
      const data = await res.json();

      if(data.success){
        statusEl.textContent = "Order sent! We'll contact you shortly to confirm.";
        statusEl.className = "bn-status bn-status-ok";
        showToast("Order sent successfully");
        setTimeout(() => { closeBuyNowForm(); form.reset(); }, 1600);
      } else {
        throw new Error(data.message || "Something went wrong");
      }
    } catch(err){
      statusEl.textContent = "Couldn't send your order — please try again or message us on WhatsApp.";
      statusEl.className = "bn-status bn-status-err";
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirm Order";
    }
  });
}

/* --------------------------------------------------------------
   SOFT SCROLL-REVEAL — fades/rises elements in as they enter view
   -------------------------------------------------------------- */
function initReveal(){
  const targets = document.querySelectorAll(".reveal");
  if(!("IntersectionObserver" in window)){
    targets.forEach(t => t.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .15, rootMargin: "0px 0px -60px 0px" });
  targets.forEach(t => observer.observe(t));
}

/* --------------------------------------------------------------
   INIT
   -------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // clock — hands ticking over the watch dial in the logo photo
  tickClock();

  // hero polish — count-up stats + mouse-parallax tilt on the watch
  initStatCounters();
  initHeroWatchTilt();

  // products, filters & cart
  renderCategoryChips();
  renderProducts();
  renderCart();
  updateCartCount();
  initReveal();
  initQuickView();
  initBuyNowForm();

  const searchInput = document.getElementById("shopSearch");
  if(searchInput){
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value.trim().toLowerCase();
      renderProducts();
    });
  }

  // footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // footer whatsapp link (general contact, no pre-filled cart)
  document.getElementById("footerWhatsapp").href =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi AK.Fashion, I have a question about your watches.")}`;

  // floating whatsapp button — same general contact message
  const waFloat = document.getElementById("waFloat");
  if(waFloat){
    waFloat.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi AK.Fashion, I have a question about your watches.")}`;
  }

  // scroll-to-top button — appears once you've scrolled past the hero
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if(scrollTopBtn){
    window.addEventListener("scroll", () => {
      scrollTopBtn.classList.toggle("show", window.scrollY > 480);
    }, { passive: true });
    scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // scroll progress bar + header shadow-on-scroll
  const scrollProgress = document.getElementById("scrollProgress");
  const siteHeader = document.getElementById("siteHeader");
  window.addEventListener("scroll", () => {
    if(siteHeader) siteHeader.classList.toggle("scrolled", window.scrollY > 12);
    if(scrollProgress){
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  }, { passive: true });

  // cart open/close
  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);
  document.getElementById("checkoutBtn").addEventListener("click", goToWhatsappCheckout);

  // mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
  mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mainNav.classList.remove("open")));
});
