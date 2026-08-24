/* ================== PRODUCT DETAIL PAGE LOGIC ================== */
/* Relies on `products` array and cart/modal helper functions already
   defined in js/script.js (addToCart, modalAddToCart, whatsappOrder,
   toggleWishlist, showToast). This file only handles rendering the
   single-product detail view and the "You May Also Like" suggestions. */

let pdCurrentProduct = null;
let pdCurrentImageIndex = 0;

function getProductIdFromUrl(){
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  return isNaN(id) ? null : id;
}

window.addEventListener('load', ()=>{
  setTimeout(()=>document.getElementById('loader').classList.add('hidden'),800);
  initScrollAnimations();
  initProductPage();
  updateCartUI();
});

function initProductPage(){
  const id = getProductIdFromUrl();
  const product = products.find(p => p.id === id);

  if(!product){
    renderProductNotFound();
    renderSuggestions(null);
    return;
  }

  pdCurrentProduct = product;
  pdCurrentImageIndex = 0;
  renderProductDetail(product);
  pdInitGallerySync();
  renderSuggestions(product);
}

function renderProductNotFound(){
  document.getElementById('productDetail').innerHTML = `
    <div class="product-not-found">
      <h2>Watch Not Found</h2>
      <p>We couldn't find the timepiece you're looking for.</p>
      <a href="index.html#catalog" class="btn btn-primary">Browse Collection</a>
    </div>
  `;
  const crumb = document.getElementById('breadcrumbCurrent');
  if(crumb) crumb.textContent = 'Not Found';
}

function pdGetSlides(p){
  const slides = p.images.map(img => ({ type:'image', src:img }));
  if(p.video){
    slides.push({ type:'video', src:p.video });
  }
  return slides;
}

function renderProductDetail(p){
  document.title = `${p.name} — AKFASHION`;
  const crumb = document.getElementById('breadcrumbCurrent');
  if(crumb) crumb.textContent = p.name;

  const slides = pdGetSlides(p);
  const poster = p.images[0] || '';

  document.getElementById('productDetail').innerHTML = `
    <div class="modal-image-section">
      <div class="pd-gallery">
        <div class="pd-gallery-track" id="pdGalleryTrack">
          ${slides.map((s,i)=> s.type==='image' ? `
            <div class="pd-slide" data-index="${i}">
              <img src="${s.src}" alt="${p.name}"/>
            </div>
          ` : `
            <div class="pd-slide pd-slide-video" data-index="${i}">
              <video src="${s.src}" ${poster?`poster="${poster}"`:''} controls playsinline preload="metadata"></video>
            </div>
          `).join('')}
        </div>
        ${slides.length>1 ? `
          <div class="pd-dots" id="pdDots">
            ${slides.map((s,i)=>`<span class="pd-dot ${i===0?'active':''}" data-index="${i}" onclick="pdChangeImage(${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="modal-thumbnails" id="pdThumbnails">
        ${slides.map((s,i)=> s.type==='image' ? `
          <div class="modal-thumb ${i===0?'active':''}" onclick="pdChangeImage(${i}, this)">
            <img src="${s.src}" alt="View ${i+1}"/>
          </div>
        ` : `
          <div class="modal-thumb ${i===0?'active':''}" onclick="pdChangeImage(${i}, this)">
            <div class="modal-thumb-video">
              <img src="${poster}" alt="Product video"/>
              <span class="thumb-play">▶</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="modal-info-section">
      <div class="modal-brand">${p.brand} · ${p.category}</div>
      <h1 class="modal-title">${p.name}</h1>
      <div class="modal-rating">
        <span class="modal-stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}</span>
        <span class="modal-rating-text">${p.rating} · ${p.reviews} reviews</span>
      </div>
      <div class="modal-price-row">
        <span class="modal-price">PKR ${p.price.toLocaleString()}</span>
        ${p.oldPrice ? `<span class="modal-price-old">PKR ${p.oldPrice.toLocaleString()}</span><span class="modal-discount">Save PKR ${(p.oldPrice-p.price).toLocaleString()}</span>` : ''}
      </div>
      <p class="modal-description">${p.desc}</p>
      <div class="modal-features">
        <h4>Key Features</h4>
        <div class="feature-list">
          ${p.features.map(f=>`<div class="feature-item">${f}</div>`).join('')}
        </div>
      </div>
      <div class="qty-selector" id="qtySelector">
        <button class="qty-btn" onclick="changeModalQty(-1)">−</button>
        <span class="qty-value" id="modalQty">1</span>
        <button class="qty-btn" onclick="changeModalQty(1)">+</button>
      </div>
      <div class="modal-actions">
        <button class="btn btn-gold" onclick="modalAddToCart(${p.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Add to Cart
        </button>
        <button class="btn btn-whatsapp" onclick="whatsappOrder(${p.id})">
          <svg viewBox="0 0 24 24" fill="white"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          Checkout via WhatsApp
        </button>
        <button class="btn btn-primary" onclick="openBuyNow(${p.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          Buy Now
        </button>
        <button class="btn btn-outline" onclick="toggleWishlist(${p.id})">Add to Wishlist</button>
      </div>
      <div class="modal-meta">
        <div class="meta-item">
          <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <div class="meta-text">Rs. 250 Shipping<br/>All Over Pakistan</div>
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div class="meta-text">5 Year Warranty</div>
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          <div class="meta-text">30 Day Returns</div>
        </div>
      </div>
    </div>
  `;
}

function pdChangeImage(index, el){
  if(!pdCurrentProduct) return;
  pdCurrentImageIndex = index;
  const track = document.getElementById('pdGalleryTrack');
  if(track && track.children[index]){
    track.scrollTo({ left: track.children[index].offsetLeft, behavior:'smooth' });
  }
  pdSetActiveSlide(index, el);
}

function pdSetActiveSlide(index, el){
  document.querySelectorAll('#pdThumbnails .modal-thumb').forEach((t,i)=>t.classList.toggle('active', el ? t===el : i===index));
  document.querySelectorAll('#pdDots .pd-dot').forEach((d,i)=>d.classList.toggle('active', i===index));
}

// Native horizontal scroll-snap powers the swipe gesture on touch devices;
// this just keeps the thumbnails/dots and any playing video in sync with it.
function pdInitGallerySync(){
  const track = document.getElementById('pdGalleryTrack');
  if(!track) return;
  let ticking = false;
  track.addEventListener('scroll', ()=>{
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const width = track.clientWidth || 1;
      const idx = Math.round(track.scrollLeft / width);
      pdSetActiveSlide(idx, null);
      track.querySelectorAll('video').forEach(v=>{
        const slideIndex = parseInt(v.closest('.pd-slide').dataset.index, 10);
        if(slideIndex !== idx && !v.paused) v.pause();
      });
      ticking = false;
    });
  }, { passive:true });
}

/* ================== BUY NOW ================== */
const WEB3FORMS_ACCESS_KEY = '3218c7cb-0707-49b7-8b14-3cfbbc3b129f';
let bnCurrentProduct = null;

function openBuyNow(id){
  const p = products.find(x => x.id === id);
  if(!p) return;
  bnCurrentProduct = p;

  const qtyEl = document.getElementById('modalQty');
  const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;
  const total = p.price * qty;

  document.getElementById('buyNowProductSummary').innerHTML = `
    <img src="${p.images[0]}" alt="${p.name}"/>
    <div class="buynow-product-info">
      <strong>${p.name}</strong>
      <span>${p.brand} · Qty: ${qty}</span>
      <span class="buynow-product-price">PKR ${total.toLocaleString()}</span>
    </div>
  `;

  document.getElementById('buyNowForm').reset();
  document.getElementById('buyNowError').textContent = '';
  document.getElementById('buyNowFormView').style.display = '';
  document.getElementById('buyNowSuccessView').style.display = 'none';
  const btn = document.getElementById('buyNowSubmitBtn');
  btn.disabled = false;
  btn.querySelector('.buynow-submit-label').textContent = 'Place Order';

  document.getElementById('buyNowOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBuyNow(e){
  if(e && e.target !== e.currentTarget) return;
  document.getElementById('buyNowOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function submitBuyNow(e){
  e.preventDefault();
  if(!bnCurrentProduct) return;

  const errorEl = document.getElementById('buyNowError');
  errorEl.textContent = '';

  const name = document.getElementById('bnName').value.trim();
  const address = document.getElementById('bnAddress').value.trim();
  const city = document.getElementById('bnCity').value.trim();
  const postalCode = document.getElementById('bnPostal').value.trim();
  const whatsapp = document.getElementById('bnWhatsapp').value.trim();

  if(!name || !address || !city || !postalCode || !whatsapp){
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }

  const p = bnCurrentProduct;
  const qtyEl = document.getElementById('modalQty');
  const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;
  const total = p.price * qty;

  const btn = document.getElementById('buyNowSubmitBtn');
  const label = btn.querySelector('.buynow-submit-label');
  btn.disabled = true;
  label.textContent = 'Placing Order…';

  const orderSummary = `${p.name} (${p.brand}) — Qty: ${qty} × PKR ${p.price.toLocaleString()} = PKR ${total.toLocaleString()}\nShipping: Rs. 250 (All Over Pakistan)\nTotal: PKR ${(total+250).toLocaleString()}`;

  try{
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New Order — ${p.name}`,
        from_name: 'AKFASHION Website',
        name: name,
        city: city,
        postal_code: postalCode,
        whatsapp_number: whatsapp,
        address: address,
        product: p.name,
        brand: p.brand,
        quantity: qty,
        order_total: `PKR ${(total+250).toLocaleString()}`,
        order_summary: orderSummary
      })
    });
    const data = await res.json();

    if(data.success){
      document.getElementById('buyNowFormView').style.display = 'none';
      document.getElementById('buyNowSuccessView').style.display = '';
      showToast('Order Placed', `Your order for ${p.name} has been received`);
    } else {
      errorEl.textContent = data.message || 'Something went wrong. Please try again.';
      btn.disabled = false;
      label.textContent = 'Place Order';
    }
  } catch(err){
    errorEl.textContent = 'Network error. Please check your connection and try again.';
    btn.disabled = false;
    label.textContent = 'Place Order';
  }
}

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    const overlay = document.getElementById('buyNowOverlay');
    if(overlay && overlay.classList.contains('open')) closeBuyNow();
  }
});

function renderSuggestions(currentProduct){
  const grid = document.getElementById('suggestionsGrid');
  if(!grid) return;

  let pool = products.filter(p => !currentProduct || p.id !== currentProduct.id);

  let suggestions;
  if(currentProduct){
    const sameCategory = pool.filter(p => p.category === currentProduct.category);
    const others = pool.filter(p => p.category !== currentProduct.category);
    suggestions = [...sameCategory, ...others].slice(0, 4);
  } else {
    suggestions = pool.slice(0, 4);
  }

  if(suggestions.length === 0){
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = suggestions.map((p,i) => `
    <div class="product-card" data-id="${p.id}" style="animation-delay:${i*0.05}s">
      <div class="product-image">
        ${p.badge ? `<span class="product-badge ${p.badge}">${p.badge === 'new' ? 'New' : 'Sale'}</span>` : ''}
        <div class="product-actions">
          <button class="product-action" onclick="event.stopPropagation();toggleWishlist(${p.id})" aria-label="Wishlist">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy" onclick="location.href='product.html?id=${p.id}'" style="cursor:pointer"/>
      </div>
      <div class="product-info" onclick="location.href='product.html?id=${p.id}'" style="cursor:pointer">
        <div class="product-brand">${p.brand} · ${p.category}</div>
        <div class="product-name">${p.name}</div>
        ${tagsChipsHtml(p)}
        <div class="product-rating">
          <span class="stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}</span>
          <span class="count">(${p.reviews})</span>
        </div>
        <div class="product-price">
          <span class="price-current">PKR ${p.price.toLocaleString()}</span>
          ${p.oldPrice ? `<span class="price-old">PKR ${p.oldPrice.toLocaleString()}</span>` : ''}
        </div>
      </div>
      <button class="product-quick-add" onclick="event.stopPropagation();addToCart(${p.id})">+ Add to Cart</button>
    </div>
  `).join('');
}
