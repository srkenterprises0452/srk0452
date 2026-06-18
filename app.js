'use strict';

const CONFIG = {
  WHATSAPP_NUMBER: '919948000452',
  BANNER_AUTO_MS: 5000
};

const state = {
  products: [],
  filteredProducts: [],
  banners: [],
  brands: [],
  activeBrand: 'All',
  activeCategory: 'All',
  searchTerm: ''
};

document.addEventListener('DOMContentLoaded', init);

async function init() {

  // ✅ 1. INSTANT LOAD (NO WAIT)
  state.products = PRODUCTS || [];
  state.filteredProducts = state.products;

  state.brands = loadBrandsFromStorage();
  state.banners = loadBannersFromStorage().filter(b => b.isActive);

  renderBanners();
  renderBrandFilters();
  renderCategoryFilters();
  renderProducts();

  document.getElementById('footerYear').textContent =
    new Date().getFullYear();

  console.log("✅ Instant load complete");

  // ✅ 2. BACKGROUND LOAD WITH TIMEOUT PROTECTION
  loadSheetWithTimeout();
}


/* ✅ SAFE SHEET LOAD WITH TIMEOUT */
async function loadSheetWithTimeout() {

  try {

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // ✅ 3 sec timeout

    const data = await loadProductsFromGoogleSheet(controller);

    clearTimeout(timeout);

    if (Array.isArray(data) && data.length > 0) {

      state.products = data;
      state.filteredProducts = data;

      renderProducts();
      applyFilters();
      renderBrandFilters();
      renderCategoryFilters();

      console.log("✅ Sheet data applied");

    }

  } catch (err) {

    console.log("⚠️ Sheet skipped due to delay (using fallback)");

  }
}


/* ============ PRODUCTS ============ */

function renderProducts() {

  const grid = document.getElementById('productGrid');

  if (!state.filteredProducts.length) {
    grid.innerHTML = '<div>No products found</div>';
    return;
  }

  grid.innerHTML = state.filteredProducts.map(p => `
    <div class="product-card">
      <div class="product-image">
        <span class="placeholder-emoji">${p.emoji || '📦'}</span>
      </div>

      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-brand">${p.brand}</div>
        <div>${p.packSize}</div>
      </div>
    </div>
  `).join('');
}


/* ============ FILTERS ============ */

function renderBrandFilters() {
  const nav = document.getElementById('brandNav');

  const brands = ['All', ...new Set(state.products.map(p => p.brand))];

  nav.innerHTML = brands.map(b => `
    <button onclick="setBrand('${b}')"
      class="filter-pill ${b === state.activeBrand ? 'active' : ''}">
      ${b}
    </button>
  `).join('');
}

function renderCategoryFilters() {
  const nav = document.getElementById('categoryNav');

  const categories = ['All', ...new Set(state.products.map(p => p.category))];

  nav.innerHTML = categories.map(c => `
    <button onclick="setCategory('${c}')"
      class="filter-pill ${c === state.activeCategory ? 'active' : ''}">
      ${c}
    </button>
  `).join('');
}

function setBrand(b) {
  state.activeBrand = b;
  applyFilters();
}

function setCategory(c) {
  state.activeCategory = c;
  applyFilters();
}

function applyFilters() {

  let list = state.products;

  if (state.activeBrand !== 'All')
    list = list.filter(p => p.brand === state.activeBrand);

  if (state.activeCategory !== 'All')
    list = list.filter(p => p.category === state.activeCategory);

  state.filteredProducts = list;

  renderProducts();
}


/* ============ BANNERS ============ */

function renderBanners() {
  const el = document.getElementById('bannerSlides');

  if (!state.banners.length) return;

  el.innerHTML = state.banners.map(b => `
    <div class="banner-slide">
      <img src="${b.image}" />
    </div>
  `).join('');
}


/* ============ STORAGE HELPERS ============ */

function loadBrandsFromStorage() {
  try {
    const raw = localStorage.getItem('srk_admin_brands');
    return raw ? JSON.parse(raw) : DEFAULT_BRANDS;
  } catch {
    return DEFAULT_BRANDS;
  }
}

function loadBannersFromStorage() {
  try {
    const raw = localStorage.getItem('srk_admin_banners');
    return raw ? JSON.parse(raw) : DEFAULT_BANNERS;
  } catch {
    return DEFAULT_BANNERS;
  }
}
