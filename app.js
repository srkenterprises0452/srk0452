/*
SRK ENTERPRISES - MAIN APPLICATION SCRIPT v5.2
Enhancements:
✅ Instant load from fallback
✅ Background sheet loading
✅ Auto UI refresh
*/

'use strict';

const CONFIG = {
  WHATSAPP_NUMBER: '919948000452',
  CART_KEY: 'srk_cart_v2',
  WISHLIST_KEY: 'srk_wishlist_v1',
  ORDERS_KEY: 'srk_orders_history',
  PRODUCT_UNIT_KEY: 'srk_product_unit_v1',
  BANNER_AUTO_MS: 5000
};

const state = {
  products: [],
  brands: [],
  banners: [],
  filteredProducts: [],
  cart: {},
  wishlist: {},
  productUnit: {},
  activeBrand: 'All',
  activeCategory: 'All',
  searchTerm: '',
  currentBanner: 0,
  bannerInterval: null
};

document.addEventListener('DOMContentLoaded', init);

// ✅ ✅ MAIN INIT (MODIFIED FOR FAST LOAD)
async function init() {

  showLoader(true);

  // ✅ Step 1: Load instant fallback data
  state.products = PRODUCTS;
  state.filteredProducts = PRODUCTS;

  state.brands = loadBrandsFromStorage();
  state.banners = loadBannersFromStorage()
    .filter(b => b.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  loadCartFromStorage();
  loadWishlistFromStorage();
  loadProductUnitChoices();

  renderBanners();
  startBannerAutoRotation();
  renderBrandFilters();
  renderCategoryFilters();
  renderProducts();
  updateCartUI();

  document.getElementById('footerYear').textContent =
    new Date().getFullYear();

  // ✅ Step 2: Hide loader quickly (UX improvement)
  setTimeout(() => showLoader(false), 500);

  // ✅ Step 3: Load Google Sheet in background
  try {
    const data = await loadProductsFromGoogleSheet();

    if (Array.isArray(data) && data.length > 0) {
      state.products = data;

      // ✅ Refresh everything safely
      applyFilters();
      renderBrandFilters();
      renderCategoryFilters();

      console.log("✅ Loaded from Google Sheet:", data.length);
    }

  } catch (e) {
    console.log("⚠️ Sheet load failed, using fallback");
  }
}


/* ============ BANNERS ============ */

function renderBanners() {

  const slidesEl = document.getElementById('bannerSlides');
  const dotsEl = document.getElementById('bannerDots');

  if (state.banners.length === 0) {
    slidesEl.innerHTML = `<div class="banner-slide gradient-navy-orange">
        <div class="banner-overlay">
          <div class="banner-overlay-content">
            <h2>Your Trusted FMCG Partner</h2>
            <p>Best Prices • Quality • Delivery</p>
          </div>
        </div>
      </div>`;
    return;
  }

  slidesEl.innerHTML = state.banners.map(b =>
    `<div class="banner-slide">
      ${b.image ? `<img src="${b.image}" />` : ''}
    </div>`
  ).join('');

  dotsEl.innerHTML = state.banners.map((_,i)=>
    `<button class="banner-dot ${i===0?'active':''}"></button>`
  ).join('');
}

function startBannerAutoRotation(){
  if(state.banners.length <=1) return;
  stopBannerAutoRotation();
  state.bannerInterval = setInterval(nextBanner, CONFIG.BANNER_AUTO_MS);
}

function stopBannerAutoRotation(){
  if(state.bannerInterval){
    clearInterval(state.bannerInterval);
    state.bannerInterval = null;
  }
}

/* ============ FILTERS ============ */

function renderBrandFilters(){
  const nav = document.getElementById('brandNav');
  const brands = ['All', ...new Set(state.products.map(p=>p.brand))];

  nav.innerHTML = brands.map(b =>
    `<button class="filter-pill ${b===state.activeBrand?'active':''}"
     onclick="setBrand('${b}')">${b}</button>`
  ).join('');
}

function renderCategoryFilters(){
  const nav = document.getElementById('categoryNav');

  let cats = state.products;
  if(state.activeBrand!=='All'){
    cats = cats.filter(p=>p.brand===state.activeBrand);
  }

  const categories = ['All', ...new Set(cats.map(p=>p.category))];

  nav.innerHTML = categories.map(c =>
    `<button class="filter-pill ${c===state.activeCategory?'active':''}"
     onclick="setCategory('${c}')">${c}</button>`
  ).join('');
}

function setBrand(b){
  state.activeBrand = b;
  renderBrandFilters();
  renderCategoryFilters();
  applyFilters();
}

function setCategory(c){
  state.activeCategory = c;
  renderCategoryFilters();
  applyFilters();
}

function handleSearch(e){
  state.searchTerm = e.target.value.toLowerCase();
  applyFilters();
}

function applyFilters(){
  let list = state.products;

  if(state.activeBrand!=='All')
    list = list.filter(p=>p.brand===state.activeBrand);

  if(state.activeCategory!=='All')
    list = list.filter(p=>p.category===state.activeCategory);

  if(state.searchTerm){
    list = list.filter(p =>
      (p.name||'').toLowerCase().includes(state.searchTerm)
    );
  }

  state.filteredProducts = list;
  renderProducts();
}

/* ============ PRODUCTS ============ */

function renderProducts(){

  const grid = document.getElementById('productGrid');

  if(state.filteredProducts.length===0){
    grid.innerHTML = '<div>No products</div>';
    return;
  }

  grid.innerHTML = state.filteredProducts.map(p =>
    `<div class="product-card">

      <div class="product-image">
        <span class="placeholder-emoji">${p.emoji || '📦'}</span>
      </div>

      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-brand">${p.brand}</div>
        <div>${p.packSize}</div>

        <button class="btn-add"
          onclick="addToCart('${p.id}')">
          Add to Cart
        </button>

      </div>

    </div>`
  ).join('');
}


/* ============ CART BASIC ============ */

function addToCart(id){

  if(!state.cart[id]){
    state.cart[id] = { qty:1 };
  } else {
    state.cart[id].qty++;
  }

  saveCartToStorage();
  updateCartUI();
}

function saveCartToStorage(){
  localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(state.cart));
}

function loadCartFromStorage(){
  const raw = localStorage.getItem(CONFIG.CART_KEY);
  state.cart = raw?JSON.parse(raw):{};
}

function updateCartUI(){
  let total=0;
  Object.values(state.cart).forEach(i=> total+=i.qty);
  document.getElementById('cartBadge').textContent = total;
}

/* ============ UTIL ============ */

function showLoader(show){
  document.getElementById('loader').classList.toggle('hidden', !show);
}
