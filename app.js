/* SRK ENTERPRISES - MAIN APPLICATION SCRIPT v5.1 FIXED
   Fixes applied:
   1. loadProductsFromGoogleSheet() wrapped with .catch() fallback
   2. loadBrandsFromStorage() / loadBannersFromStorage() guard checks
   3. CATEGORIES guard — falls back to default if undefined
   4. cart-item-center CSS class added (in style.css)
   5. Unsafe onerror string interpolation fixed
   6. footerYear null-check added
   7. "buisiness" typo fixed → "business"
   8. showToast uses module-level timer variable
   9. Cart bar "Order via WhatsApp" click goes to checkout directly
   10. Search debounce added (250ms)
   11. Cart cleared after successful order submission
*/
'use strict';

// Dual mode: retailer = index.html, salesman = index.html?mode=salesman
const urlParams = new URLSearchParams(window.location.search);
const isSalesmanMode = urlParams.get('mode') === 'salesman';

const CONFIG = {
    WHATSAPP_NUMBER: '919948000452',
    CART_KEY: 'srk_cart_v2',
    WISHLIST_KEY: 'srk_wishlist_v1',
    ORDERS_KEY: 'srk_orders_history',
    PRODUCT_UNIT_KEY: 'srk_product_unit_v1',
    BANNER_AUTO_MS: 5000,
};
const SHOP_BACKEND = "firebase";
let shopMasterSynced = false;

const SHOP_CACHE_KEY = 'srk_shop_master_cache_v1';
let shopMaster = [];

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

// ✅ FIX 8: Module-level toast timer instead of function property
let toastTimer = null;

// ✅ FIX 10: Module-level search debounce timer
let searchDebounce = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    showLoader(true);

    if (isSalesmanMode) {
        const block = document.getElementById('salesmanBlock');
        if (block) block.style.display = 'block';

        const banner = document.getElementById('bannerCarousel');
        if (banner) banner.style.display = 'none';

        setupSalesmanShopMode();
    }

    // ✅ FIX 1: Wrapped with .catch() — if Google Sheet fails, falls back to PRODUCTS
    state.products = await loadProductsFromGoogleSheet().catch(() => {
        console.warn('SRK: Product load failed, using local fallback');
        return typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
    });

    // ✅ FIX 2: Guard checks before calling — these are defined in products.js
    state.brands = (typeof loadBrandsFromStorage === 'function')
        ? loadBrandsFromStorage()
        : (typeof DEFAULT_BRANDS !== 'undefined' ? DEFAULT_BRANDS : []);

    const rawBanners = (typeof loadBannersFromStorage === 'function')
        ? loadBannersFromStorage()
        : (typeof DEFAULT_BANNERS !== 'undefined' ? DEFAULT_BANNERS : []);

    state.banners = rawBanners
        .filter(b => b.isActive)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    state.filteredProducts = state.products;

    loadCartFromStorage();
    loadWishlistFromStorage();
    loadProductUnitChoices();
    renderBanners();
    startBannerAutoRotation();
    renderBrandFilters();
    renderCategoryFilters();

    // Hide skeleton, show real grid
    const skeleton = document.getElementById('skeletonGrid');
    const section = document.getElementById('productsSection');
    const grid = document.getElementById('productGrid');
    if (skeleton) skeleton.classList.add('hidden');
    if (section) section.classList.remove('hidden');
    if (grid) grid.classList.remove('hidden');

    renderProducts();
    updateCartUI();

    // ✅ FIX 6: null-check before setting footer year
    const footerYearEl = document.getElementById('footerYear');
    if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();

    showLoader(false);
}

/* ============================================================
   BANNER CAROUSEL
   ============================================================ */
function renderBanners() {
    const slidesEl = document.getElementById('bannerSlides');
    const dotsEl = document.getElementById('bannerDots');
    if (!slidesEl || !dotsEl) return;

    if (state.banners.length === 0) {
        slidesEl.innerHTML = `
            <div class="banner-slide gradient-pure-navy">
                <div class="banner-overlay">
                    <div class="banner-overlay-content">
                        <h2>Your Trusted FMCG<br>Distribution Partner</h2>
                        <p>Best Quality &bull; Best Prices &bull; Timely Delivery</p>
                        <button onclick="document.getElementById('productsSection').scrollIntoView({behavior:'smooth'})">Shop Now</button>
                    </div>
                </div>
            </div>`;
        dotsEl.innerHTML = '';
        const prev = document.querySelector('.banner-prev');
        const next = document.querySelector('.banner-next');
        if (prev) prev.style.display = 'none';
        if (next) next.style.display = 'none';
        return;
    }

    slidesEl.innerHTML = state.banners.map(b => {
        const overlay = b.useOverlay
            ? `<div class="banner-overlay">
                 <div class="banner-overlay-content">
                   ${b.title ? `<h2>${escapeHtml(b.title)}</h2>` : ''}
                   ${b.subtitle ? `<p>${escapeHtml(b.subtitle)}</p>` : ''}
                   ${b.buttonText ? `<button onclick="document.getElementById('productsSection').scrollIntoView({behavior:'smooth'})">${escapeHtml(b.buttonText)}</button>` : ''}
                 </div>
               </div>`
            : '';
        const bgClass = !b.image ? `gradient-${b.bgGradient || 'navy-orange'}` : '';
        const imgHtml = b.image ? `<img src="${escapeHtml(b.image)}" alt="${escapeHtml(b.title || 'Banner')}" />` : '';
        return `<div class="banner-slide ${bgClass}">${imgHtml}${overlay}</div>`;
    }).join('');

    dotsEl.innerHTML = state.banners.map((_, i) =>
        `<button class="banner-dot ${i === 0 ? 'active' : ''}" onclick="goToBanner(${i})" aria-label="Slide ${i + 1}"></button>`
    ).join('');

    state.currentBanner = 0;
    updateBannerPosition();

    if (state.banners.length <= 1) {
        const prev = document.querySelector('.banner-prev');
        const next = document.querySelector('.banner-next');
        if (prev) prev.style.display = 'none';
        if (next) next.style.display = 'none';
        dotsEl.style.display = 'none';
    }

    // Touch swipe support
    const carousel = document.getElementById('bannerCarousel');
    if (!carousel) return;
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; stopBannerAutoRotation(); }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { if (diff > 0) nextBanner(); else prevBanner(); }
        setTimeout(startBannerAutoRotation, 3000);
    }, { passive: true });
    carousel.addEventListener('mouseenter', stopBannerAutoRotation);
    carousel.addEventListener('mouseleave', startBannerAutoRotation);
}

function updateBannerPosition() {
    const slidesEl = document.getElementById('bannerSlides');
    if (slidesEl) slidesEl.style.transform = `translateX(-${state.currentBanner * 100}%)`;
    document.querySelectorAll('.banner-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === state.currentBanner);
    });
}

function nextBanner() {
    if (!state.banners.length) return;
    state.currentBanner = (state.currentBanner + 1) % state.banners.length;
    updateBannerPosition();
}

function prevBanner() {
    if (!state.banners.length) return;
    state.currentBanner = (state.currentBanner - 1 + state.banners.length) % state.banners.length;
    updateBannerPosition();
}

function goToBanner(idx) {
    state.currentBanner = idx;
    updateBannerPosition();
}

function startBannerAutoRotation() {
    stopBannerAutoRotation();
    if (state.banners.length > 1) {
        state.bannerInterval = setInterval(nextBanner, CONFIG.BANNER_AUTO_MS);
    }
}

function stopBannerAutoRotation() {
    if (state.bannerInterval) { clearInterval(state.bannerInterval); state.bannerInterval = null; }
}

/* ============================================================
   DUAL FILTERS
   ============================================================ */

// ✅ FIX 3: Safe CATEGORIES reference — falls back to empty array if undefined
function getSafeCategories() {
    if (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES)) return CATEGORIES;
    const cats = new Set(['All']);
    state.products.forEach(p => { if (p.category) cats.add(p.category); });
    return [...cats];
}

function getAvailableBrands() {
    const set = new Set();
    state.products.forEach(p => { if (p.brand) set.add(p.brand); });
    return [...set];
}

function getAvailableCategoriesForBrand(brand) {
    const cats = getSafeCategories().filter(c => c !== 'All');
    if (brand === 'All') return cats;
    const set = new Set();
    state.products.filter(p => p.brand === brand).forEach(p => set.add(p.category));
    return cats.filter(c => set.has(c));
}

function renderBrandFilters() {
    const nav = document.getElementById('brandNav');
    if (!nav) return;
    const brandsAvailable = getAvailableBrands();
    const allPill = `<button class="filter-pill brand-pill ${state.activeBrand === 'All' ? 'active' : ''}" onclick="setBrand('All')">All</button>`;
    const brandPills = state.brands
        .filter(b => brandsAvailable.includes(b.name))
        .map(b => {
            const logo = b.logo ? `<img class="pill-logo" src="${escapeHtml(b.logo)}" alt="${escapeHtml(b.name)}" onerror="this.style.display='none'">` : '';
            return `<button class="filter-pill brand-pill ${state.activeBrand === b.name ? 'active' : ''}" onclick="setBrand('${escapeJs(b.name)}')">${logo}<span>${escapeHtml(b.name)}</span></button>`;
        }).join('');
    nav.innerHTML = allPill + brandPills;
}

function renderCategoryFilters() {
    const nav = document.getElementById('categoryNav');
    if (!nav) return;
    const availableCats = getAvailableCategoriesForBrand(state.activeBrand);
    const allPill = `<button class="filter-pill ${state.activeCategory === 'All' ? 'active' : ''}" onclick="setCategory('All')">All</button>`;
    const catPills = availableCats
        .map(c => `<button class="filter-pill ${state.activeCategory === c ? 'active' : ''}" onclick="setCategory('${escapeJs(c)}')">${escapeHtml(c)}</button>`)
        .join('');
    nav.innerHTML = allPill + catPills;
}

function setBrand(brand) {
    state.activeBrand = brand;
    const availableCats = getAvailableCategoriesForBrand(brand);
    if (state.activeCategory !== 'All' && !availableCats.includes(state.activeCategory)) {
        state.activeCategory = 'All';
    }
    renderBrandFilters();
    renderCategoryFilters();
    applyFilters();
    const section = document.getElementById('productsSection');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setCategory(cat) {
    state.activeCategory = cat;
    renderCategoryFilters();
    applyFilters();
    const section = document.getElementById('productsSection');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearAllFilters() {
    state.activeBrand = 'All';
    state.activeCategory = 'All';
    state.searchTerm = '';
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    renderBrandFilters();
    renderCategoryFilters();
    applyFilters();
}

// ✅ FIX 10: Search debounced at 250ms — prevents janky re-render on every keystroke
function handleSearch(event) {
    clearTimeout(searchDebounce);
    const value = event.target.value;
    searchDebounce = setTimeout(() => {
        state.searchTerm = value.trim().toLowerCase();
        applyFilters();
    }, 250);
}

function applyFilters() {
    let list = state.products;
    if (state.activeBrand !== 'All') list = list.filter(p => p.brand === state.activeBrand);
    if (state.activeCategory !== 'All') list = list.filter(p => p.category === state.activeCategory);
    if (state.searchTerm) {
        const q = state.searchTerm;
        list = list.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.nameTelugu || '').toLowerCase().includes(q) ||
            (p.brand || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
        );
    }
    state.filteredProducts = list;
    renderProducts();

    const info = document.getElementById('activeFilterInfo');
    const text = document.getElementById('activeFilterText');
    if (info && text) {
        if (state.activeBrand !== 'All' || state.activeCategory !== 'All' || state.searchTerm) {
            const parts = [];
            if (state.activeBrand !== 'All') parts.push(`Brand: <strong>${escapeHtml(state.activeBrand)}</strong>`);
            if (state.activeCategory !== 'All') parts.push(`Category: <strong>${escapeHtml(state.activeCategory)}</strong>`);
            if (state.searchTerm) parts.push(`Search: <strong>"${escapeHtml(state.searchTerm)}"</strong>`);
            text.innerHTML = parts.join(' &middot; ');
            info.classList.remove('hidden');
        } else {
            info.classList.add('hidden');
        }
    }
}

/* ============================================================
   PRODUCT RENDERING
   ============================================================ */
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const emptyEl = document.getElementById('emptyResults');
    const info = document.getElementById('resultsInfo');
    if (!grid) return;

    if (state.filteredProducts.length === 0) {
        grid.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (info) info.textContent = '';
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    if (info) info.textContent = `Showing ${state.filteredProducts.length} product${state.filteredProducts.length !== 1 ? 's' : ''}`;
    grid.innerHTML = state.filteredProducts.map(renderProductCard).join('');
}

function getProductUnit(p) {
    if (state.productUnit[p.id]) return state.productUnit[p.id];
    if (p.allowCarton && p.defaultUnit === 'carton') return 'carton';
    if (p.allowSingle) return 'single';
    if (p.allowCarton) return 'carton';
    return 'single';
}

function setProductUnit(productId, unit) {
    state.productUnit[productId] = unit;
    saveProductUnitChoices();
    renderProducts();
}

function getCurrentRate(p, qty, unitType) {
    if (unitType === 'carton') {
        if (qty >= 10) return p.cartonPrice_10_plus;
        if (qty >= 5) return p.cartonPrice_5_9;
        return p.cartonPrice_1_4;
    }
    if (p.allowCarton) return p.singlePrice;
    if (qty >= 10) return p.singlePrice_10_plus;
    if (qty >= 5) return p.singlePrice_5_9;
    return p.singlePrice_1_4;
}

function getMrp(p, unitType) {
    return unitType === 'carton' ? p.cartonMrp : p.singleMrp;
}

function renderProductCard(p) {
    const cartKey = (unit) => `${p.id}__${unit}`;
    const currentUnit = getProductUnit(p);
    const qty = state.cart[cartKey(currentUnit)] ? state.cart[cartKey(currentUnit)].qty : 0;
    const displayQty = qty || 1;

    const inCart = qty > 0;
    const isOut = p.stockStatus === 'out';
    const isFav = !!state.wishlist[p.id];

    const currentRate = getCurrentRate(p, displayQty, currentUnit);
    const mrp = getMrp(p, currentUnit);
    const hasDiscount = mrp > currentRate;
    const discountPct = hasDiscount ? Math.round(((mrp - currentRate) / mrp) * 100) : 0;

    const fallbackEmoji = escapeHtml(p.emoji || '📦');

    // ✅ FIX 5: Safe onerror — no string interpolation of fallback into onclick/onerror
    const imageBlock = p.image
        ? `<img
               src="${escapeHtml(p.image)}"
               alt="${escapeHtml(p.name)}"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
           />
           <span class="placeholder-emoji" style="display:none;">${fallbackEmoji}</span>`
        : `<span class="placeholder-emoji">${fallbackEmoji}</span>`;

    const stockBadge = isOut
        ? `<span class="stock-badge out">Out of Stock</span>`
        : `<span class="stock-badge">In Stock</span>`;

    const discountBadge = hasDiscount && !isOut
        ? `<span class="discount-badge">${discountPct}% OFF</span>`
        : '';

    const teluguLine = p.nameTelugu
        ? `<div class="product-name-telugu">${escapeHtml(p.nameTelugu)}</div>`
        : '';

    const descLine = p.description && currentUnit === 'carton'
        ? `<div class="product-desc">${escapeHtml(p.description)}</div>`
        : '';

    let unitToggle = '';
    if (p.allowSingle && p.allowCarton) {
        unitToggle = `
            <div class="unit-toggle">
                <button class="${currentUnit === 'single' ? 'active' : ''}" onclick="setProductUnit('${escapeJs(p.id)}', 'single')">Single</button>
                <button class="${currentUnit === 'carton' ? 'active' : ''}" onclick="setProductUnit('${escapeJs(p.id)}', 'carton')">${escapeHtml(p.cartonType || 'Carton')}</button>
            </div>`;
    }

    let tierHint = '';
    let tierTable = '';

    if (currentUnit === 'carton') {
        const ct = escapeHtml(p.cartonType || 'Carton');
        tierHint = `<button class="tier-hint" onclick="toggleTierTable('${escapeJs(p.id)}')">Buy 5+: &#8377;${p.cartonPrice_5_9}</button>`;
        tierTable = `
            <div class="tier-table" id="tier-${escapeHtml(p.id)}">
                <div class="tier-table-row ${displayQty >= 1 && displayQty <= 4 ? 'active' : ''}">
                    <span>1-4 ${ct.toLowerCase()}s</span>
                    <strong>&#8377;${p.cartonPrice_1_4}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 5 && displayQty <= 9 ? 'active' : ''}">
                    <span>5-9 ${ct.toLowerCase()}s</span>
                    <strong>&#8377;${p.cartonPrice_5_9}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 10 ? 'active' : ''}">
                    <span>10+ ${ct.toLowerCase()}s</span>
                    <strong>&#8377;${p.cartonPrice_10_plus}</strong>
                </div>
            </div>`;
    } else if (!p.allowCarton) {
        tierHint = `<button class="tier-hint" onclick="toggleTierTable('${escapeJs(p.id)}')">Buy 5+: &#8377;${p.singlePrice_5_9}</button>`;
        tierTable = `
            <div class="tier-table" id="tier-${escapeHtml(p.id)}">
                <div class="tier-table-row ${displayQty >= 1 && displayQty <= 4 ? 'active' : ''}">
                    <span>1-4 pcs</span>
                    <strong>&#8377;${p.singlePrice_1_4}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 5 && displayQty <= 9 ? 'active' : ''}">
                    <span>5-9 pcs</span>
                    <strong>&#8377;${p.singlePrice_5_9}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 10 ? 'active' : ''}">
                    <span>10+ pcs</span>
                    <strong>&#8377;${p.singlePrice_10_plus}</strong>
                </div>
            </div>`;
    }

    const priceDisplay = `
        <div class="price-display">
            ${hasDiscount ? `<div class="mrp-line">MRP: <span class="mrp-value">&#8377;${mrp}</span></div>` : ''}
            <div>
                <span class="current-price">&#8377;${currentRate}</span>
                <span class="current-price-suffix">/${getUnitLabel(p, currentUnit).replace(/s$/, '')}</span>
            </div>
            ${tierHint}
            ${tierTable}
        </div>`;

    const unitLabel = getUnitLabel(p, currentUnit);

    // ✅ btn-add uses text only — no CSS emoji content property
    const btnText = isOut ? 'Out of Stock' : inCart ? '&#10003; Added' : '+ Add to Cart';

    return `
        <div class="product-card">
            <button class="heart-btn ${isFav ? 'active' : ''}" onclick="toggleWishlist('${escapeJs(p.id)}')" aria-label="${isFav ? 'Remove from wishlist' : 'Add to wishlist'}">
                ${isFav ? '♥' : '♡'}
            </button>

            <div class="product-image" ${p.image ? `onclick="openImageZoom('${escapeJs(p.image)}')"` : ''}>
                ${discountBadge}
                ${imageBlock}
                ${stockBadge}
            </div>

            <div class="product-info">
                <div class="product-name">${escapeHtml(p.name)}</div>
                ${teluguLine}
                <div class="product-brand">${escapeHtml(p.brand)}</div>
                <div class="product-pack">${escapeHtml(p.packSize)}</div>
                ${descLine}
                ${unitToggle}
                ${priceDisplay}

                <div class="qty-add-row">
                    <div class="product-footer-row">
                        <div class="qty-selector">
                            <button class="qty-btn" onclick="decrementQtyInput('${escapeJs(p.id)}')" aria-label="Decrease quantity" ${isOut ? 'disabled' : ''}>&#8722;</button>
                            <input
                                class="qty-input"
                                id="qty-${escapeHtml(p.id)}"
                                value="${displayQty}"
                                inputmode="numeric"
                                onchange="updateQtyInput('${escapeJs(p.id)}', this.value)"
                                aria-label="Quantity"
                                ${isOut ? 'disabled' : ''}
                            />
                            <button class="qty-btn" onclick="incrementQtyInput('${escapeJs(p.id)}')" aria-label="Increase quantity" ${isOut ? 'disabled' : ''}>&#43;</button>
                        </div>
                        <button
                            class="btn-add ${inCart ? 'in-cart' : ''}"
                            onclick="addToCart('${escapeJs(p.id)}')"
                            ${isOut ? 'disabled' : ''}
                        >${btnText}</button>
                    </div>
                    <div class="qty-unit-label">${escapeHtml(unitLabel)}</div>
                </div>
            </div>
        </div>`;
}

function toggleTierTable(productId) {
    // Close all other open tier tables
    document.querySelectorAll('.tier-table').forEach(el => {
        if (el.id !== `tier-${productId}`) el.classList.remove('show');
    });
    const table = document.getElementById(`tier-${productId}`);
    if (table) table.classList.toggle('show');
}

function getUnitLabel(p, unitType) {
    if (unitType === 'carton') return (p.cartonType || 'Carton').toLowerCase() + 's';
    return 'pcs';
}

function getQtyFromInput(id) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return 1;
    const v = parseInt(input.value, 10);
    return isNaN(v) || v < 1 ? 1 : v;
}

function incrementQtyInput(id) {
    const input = document.getElementById(`qty-${id}`);
    if (input) input.value = parseInt(input.value || '1', 10) + 1;
}

function decrementQtyInput(id) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;
    const v = parseInt(input.value || '1', 10);
    if (v > 1) input.value = v - 1;
}

function updateQtyInput(id, value) {
    const v = parseInt(value, 10);
    const input = document.getElementById(`qty-${id}`);
    if (input) input.value = isNaN(v) || v < 1 ? 1 : v;
}

/* ============================================================
   CART
   ============================================================ */
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stockStatus === 'out') return;
    const unitType = getProductUnit(product);
    const qty = getQtyFromInput(productId);
    const key = `${productId}__${unitType}`;
  state.cart[key] = {
    productId,
    unitType,
    qty,
    name: product.name,
    brand: product.brand,
    packSize: product.packSize
};

    saveCartToStorage();
    renderProducts();
    updateCartUI();
    const unitLabel = unitType === 'carton'
        ? (product.cartonType || 'Carton').toLowerCase() + 's'
        : 'pcs';
    showToast(`\u2713 Added ${qty} ${unitLabel} of ${product.name}`, 'success');
}

function toggleWishlist(productId) {
    if (state.wishlist[productId]) {
        delete state.wishlist[productId];
        showToast('Removed from wishlist', 'info');
    } else {
        state.wishlist[productId] = true;
        showToast('\u2665 Added to wishlist', 'success');
    }
    saveWishlistToStorage();
    renderProducts();
}

function updateCartItemQty(key, newQty) {
    newQty = parseInt(newQty, 10);
    if (isNaN(newQty) || newQty <= 0) { removeCartItem(key); return; }
    if (state.cart[key]) {
        state.cart[key].qty = newQty;
        saveCartToStorage();
        renderCart();
        updateCartUI();
        renderProducts();
    }
}

function incrementCartItem(key) {
    if (state.cart[key]) {
        state.cart[key].qty++;
        saveCartToStorage();
        renderCart();
        updateCartUI();
        renderProducts();
    }
}

function decrementCartItem(key) {
    if (!state.cart[key]) return;
    if (state.cart[key].qty <= 1) { removeCartItem(key); return; }
    state.cart[key].qty--;
    saveCartToStorage();
    renderCart();
    updateCartUI();
    renderProducts();
}

function removeCartItem(key) {
    const item = state.cart[key];
    delete state.cart[key];
    saveCartToStorage();
    renderCart();
    updateCartUI();
    renderProducts();
    if (item) {
        const p = state.products.find(x => x.id === item.productId);
        if (p) showToast(`Removed ${p.name} from cart`, 'info');
    }
}

function saveCartToStorage() {
    try { localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(state.cart)); } catch (e) {}
}

function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CONFIG.CART_KEY);
        state.cart = raw ? JSON.parse(raw) : {};
        Object.keys(state.cart).forEach(k => {
            const item = state.cart[k];
            if (!state.products.find(p => p.id === item.productId)) delete state.cart[k];
        });
    } catch (e) { state.cart = {}; }
}

function saveWishlistToStorage() { try { localStorage.setItem(CONFIG.WISHLIST_KEY, JSON.stringify(state.wishlist)); } catch (e) {} }
function loadWishlistFromStorage() { try { const raw = localStorage.getItem(CONFIG.WISHLIST_KEY); state.wishlist = raw ? JSON.parse(raw) : {}; } catch (e) { state.wishlist = {}; } }
function saveProductUnitChoices() { try { localStorage.setItem(CONFIG.PRODUCT_UNIT_KEY, JSON.stringify(state.productUnit)); } catch (e) {} }
function loadProductUnitChoices() { try { const raw = localStorage.getItem(CONFIG.PRODUCT_UNIT_KEY); state.productUnit = raw ? JSON.parse(raw) : {}; } catch (e) { state.productUnit = {}; } }

function getCartSummary() {
    let totalUnits = 0, grandTotal = 0, totalMrp = 0, totalSavings = 0;
    let totalCartonsCount = 0, totalSinglesCount = 0;
    const lines = [];
    Object.entries(state.cart).forEach(([key, item]) => {
        const p = state.products.find(x => x.id === item.productId);
        if (!p) return;
        const rate = getCurrentRate(p, item.qty, item.unitType);
        const mrp = getMrp(p, item.unitType);
        const amount = rate * item.qty;
        const mrpAmount = mrp * item.qty;
        const savings = Math.max(0, mrpAmount - amount);
        totalUnits += item.qty;
        grandTotal += amount;
        totalMrp += mrpAmount;
        totalSavings += savings;
        if (item.unitType === 'carton') totalCartonsCount += item.qty;
        else totalSinglesCount += item.qty;
        lines.push({ key, product: p, unitType: item.unitType, qty: item.qty, rate, mrp, amount, savings });
    });
    return { totalUnits, totalCartonsCount, totalSinglesCount, grandTotal, totalMrp, totalSavings, lines };
}

function updateCartUI() {
    const { totalUnits, grandTotal } = getCartSummary();
    const badge = document.getElementById('cartBadge');
    const myCartTotal = document.getElementById('myCartTotal');
    const bottomBar = document.getElementById('bottomCartSummary');
    const bcsCount = document.getElementById('bcsCount');
    const bcsTotal = document.getElementById('bcsTotal');

    if (badge) badge.textContent = totalUnits;
    if (myCartTotal) myCartTotal.textContent = `\u20B9${grandTotal.toLocaleString('en-IN')}`;

    // ✅ FIX 6 / FIX 9: Cart bar only shows when items exist; click goes to checkout
    if (bottomBar) {
        if (totalUnits > 0) {
            bottomBar.classList.remove('hidden');
            if (bcsCount) bcsCount.textContent = `${totalUnits} item${totalUnits !== 1 ? 's' : ''}`;
            if (bcsTotal) bcsTotal.textContent = `\u20B9${grandTotal.toLocaleString('en-IN')}`;
        } else {
            bottomBar.classList.add('hidden');
        }
    }
}

function openCart() {
    renderCart();
    const modal = document.getElementById('cartModal');
    if (modal) { modal.classList.add('show'); document.body.style.overflow = 'hidden'; }
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
}

function renderCart() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    if (!body || !footer) return;

    const { totalUnits, totalCartonsCount, totalSinglesCount, grandTotal, totalMrp, totalSavings, lines } = getCartSummary();

    if (lines.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Browse products and add items to get started.</p>
                <button class="btn-continue" onclick="closeCart()">Continue Shopping</button>
            </div>`;
        footer.innerHTML = '';
        return;
    }

    body.innerHTML = lines.map(({ key, product, unitType, qty, rate, mrp, amount }) => {
        const fallback = product.emoji || '📦';
        const unitLabel = unitType === 'carton'
            ? (product.cartonType || 'Carton').toLowerCase() + 's'
            : 'pcs';
        const unitsInfo = unitType === 'carton' && product.unitsPerCarton
            ? ` (${qty * product.unitsPerCarton} units)`
            : '';
        const teluguLine = product.nameTelugu
            ? `<div class="cart-item-name-te">${escapeHtml(product.nameTelugu)}</div>`
            : '';
        const mrpLine = mrp > rate ? `<span class="cart-item-mrp">&#8377;${mrp}</span>` : '';
        const unitBadge = `<span class="cart-item-unit-badge ${unitType}">${unitType.toUpperCase()}</span>`;

        // ✅ FIX 5: Safe image onerror — no string interpolation into event handler
        const imageHtml = product.image
            ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.style.display='none'" />`
            : `<span style="font-size:28px;">${fallback}</span>`;

        return `
            <div class="cart-item">
                <div class="cart-item-left">${imageHtml}</div>
                <div class="cart-item-center">
                    <div class="cart-name">${escapeHtml(product.name)}${unitBadge}</div>
                    ${teluguLine}
                    <div class="cart-unit">${escapeHtml(product.brand)} &bull; ${escapeHtml(product.packSize)} &bull; ${escapeHtml(unitLabel)}</div>
                    <div class="cart-price">Rate: &#8377;${rate}/${unitLabel.replace(/s$/, '')}${mrpLine}</div>
                    ${unitsInfo ? `<div class="cart-unit">${unitsInfo}</div>` : ''}
                </div>
                <div class="cart-item-right">
                    <div class="cart-qty">
                        <button onclick="decrementCartItem('${escapeJs(key)}')" aria-label="Decrease">&#8722;</button>
                        <span>${qty}</span>
                        <button onclick="incrementCartItem('${escapeJs(key)}')" aria-label="Increase">&#43;</button>
                    </div>
                    <div class="cart-total">&#8377;${amount.toLocaleString('en-IN')}</div>
                    <button class="cart-item-remove" onclick="removeCartItem('${escapeJs(key)}')">Remove</button>
                </div>
            </div>`;
    }).join('');

    const savingsRow = totalSavings > 0
        ? `<div class="cart-summary-row savings"><span>&#127881; You Save:</span><span>&#8377;${totalSavings.toLocaleString('en-IN')}</span></div>`
        : '';
    const mrpRow = totalSavings > 0
        ? `<div class="cart-summary-row"><span>Total MRP:</span><span style="text-decoration:line-through;color:#999;">&#8377;${totalMrp.toLocaleString('en-IN')}</span></div>`
        : '';
    const breakdown = (totalCartonsCount > 0 && totalSinglesCount > 0)
        ? `<div class="cart-summary-row"><span>Cartons / Pieces:</span><span><strong>${totalCartonsCount} cartons + ${totalSinglesCount} pcs</strong></span></div>`
        : '';

    footer.innerHTML = `
        <div class="cart-summary">
            <div class="cart-summary-row"><span>Total Items:</span><span><strong>${totalUnits}</strong></span></div>
            ${breakdown}
            ${mrpRow}
            ${savingsRow}
            <div class="cart-summary-row"><span>Sub Total:</span><span>&#8377;${grandTotal.toLocaleString('en-IN')}</span></div>
            <div class="cart-summary-row total"><span>Grand Total:</span><span>&#8377;${grandTotal.toLocaleString('en-IN')}</span></div>
        </div>
        <button class="btn-checkout" onclick="proceedToCheckout()">
            Proceed to Checkout &#8594;
        </button>`;
}
function getFirebase() {
    if (!window.SRK_FB || !window.SRK_FB.db) {
        console.error("Firebase not loaded. window.SRK_FB is missing.");
        setSalesmanShopStatus("Firebase not loaded. Please refresh.", "error");
        return null;
    }

    return window.SRK_FB;
}

/* ============================================================
   SALESMAN SHOP MASTER - GOOGLE SHEET INTEGRATION
   Single source of truth: Google Sheet.
   Local storage is used only as a fallback cache.
   ============================================================ */
function setSalesmanShopStatus(message, type = 'info') {
    const el = document.getElementById('salesmanShopStatus');
    if (!el) return;
    el.textContent = message || '';
    el.style.color = type === 'error' ? '#b91c1c' : (type === 'success' ? '#0f766e' : '#64748b');
}

function getLocalShopMaster() {
    try {
        const raw = localStorage.getItem(SHOP_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveLocalShopMaster(shops) {
    try {
        localStorage.setItem(SHOP_CACHE_KEY, JSON.stringify(Array.isArray(shops) ? shops : []));
    } catch (e) {}
}

function normalizeShop(s) {
    return {
        shopId: s.shopId || s.id || '',
        shopName: String(s.shopName || s.name || '').trim(),
        contactPerson: String(s.contactPerson || s.ownerName || '').trim(),
        mobile: String(s.mobile || '').trim(),
        district: String(s.district || '').trim(),
        mandal: String(s.mandal || s.mondal || '').trim(),
        village: String(s.village || '').trim(),
        createdAt: s.createdAt || '',
        updatedAt: s.updatedAt || ''
    };
}

function getSelectedSalesLocation() {
    return {
        district: (document.getElementById('district')?.value || '').trim(),
        mandal: (document.getElementById('mandal')?.value || '').trim(),
        village: (document.getElementById('village')?.value || '').trim()
    };
}

function getMatchingShopsForSelectedLocation() {
    const { district, mandal, village } = getSelectedSalesLocation();
    if (!district || !mandal || !village) return [];

    return shopMaster
        .filter(s => s.district === district && s.mandal === mandal && s.village === village)
        .sort((a, b) => a.shopName.localeCompare(b.shopName));
}

function renderShopOptions() {
    if (!isSalesmanMode) return;

    const list = document.getElementById('shopList');
    if (!list) return;

    list.innerHTML = '';
    const { district, mandal, village } = getSelectedSalesLocation();

    if (!district || !mandal || !village) {
        setSalesmanShopStatus('Select district, mandal and village to load shops.');
        return;
    }

    const shops = getMatchingShopsForSelectedLocation();

    shops.forEach(shop => {
        const option = document.createElement('option');
        option.value = shop.shopName;
        option.label = [shop.mobile, shop.contactPerson].filter(Boolean).join(' | ');
        list.appendChild(option);
    });

    setSalesmanShopStatus(
        shops.length
            ? `${shops.length} shop(s) available for selected village.`
            : 'No shops found for this village. Enter shop details and click + Add New Shop.',
        shops.length ? 'success' : 'info'
    );
}

function resetShopSelection() {
    const shop = document.getElementById('shop');
    const contact = document.getElementById('salesContactPerson');
    const mobile = document.getElementById('salesMobile');
    if (shop) shop.value = '';
    if (contact) contact.value = '';
    if (mobile) mobile.value = '';
}

function getSelectedShopFromInput() {
    const shopName = String(document.getElementById('shop')?.value || '').trim();
    if (!shopName) return null;
    const { district, mandal, village } = getSelectedSalesLocation();

    return shopMaster.find(s =>
        s.shopName.toLowerCase() === shopName.toLowerCase() &&
        s.district === district &&
        s.mandal === mandal &&
        s.village === village
    ) || null;
}

function autofillShopDetails() {
    const selected = getSelectedShopFromInput();
    if (!selected) return;

    const contact = document.getElementById('salesContactPerson');
    const mobile = document.getElementById('salesMobile');
    if (contact && selected.contactPerson) contact.value = selected.contactPerson;
    if (mobile && selected.mobile) mobile.value = selected.mobile;

    setSalesmanShopStatus(`Selected: ${selected.shopName}${selected.mobile ? ' | ' + selected.mobile : ''}`, 'success');
}

async function syncShopsFromFirebase(options = {}) {
    if (!isSalesmanMode) return [];

    const fb = getFirebase();
    if (!fb) return [];

    try {
        if (!options.silent) {
            setSalesmanShopStatus("Loading shops from Firebase...");
        }


const { district, mandal, village } = getSelectedSalesLocation();

const q = fb.query(
    fb.collection(fb.db, "shops"),
    fb.where("district", "==", district),
    fb.where("mandal", "==", mandal),
    fb.where("village", "==", village)
);

const snapshot = await fb.getDocs(q);


        shopMaster = snapshot.docs.map(doc => ({
            firebaseId: doc.id,
            ...doc.data()
        }));

        shopMasterSynced = true;
        saveLocalShopMaster(shopMaster);
        renderShopOptions();

        if (!options.silent) {
            setSalesmanShopStatus(`${shopMaster.length} shop(s) loaded from Firebase.`, "success");
        }

        return shopMaster;

    } catch (error) {
        console.error("Firebase shop sync failed:", error);

        shopMaster = getLocalShopMaster();
        shopMasterSynced = true;
        renderShopOptions();

        setSalesmanShopStatus("Firebase sync failed. Loaded local cache.", "error");
        return shopMaster;
    }
}

async function addNewShopFromSalesmanBlock() {
    if (!isSalesmanMode) return;

    const fb = getFirebase();
    if (!fb) return;

    const { district, mandal, village } = getSelectedSalesLocation();

    const shopName = String(document.getElementById("shop")?.value || "").trim();
    const contactPerson = String(document.getElementById("salesContactPerson")?.value || "").trim();
    const mobile = String(document.getElementById("salesMobile")?.value || "").trim();

    if (!district || !mandal || !village) {
        showToast("Please select district, mandal and village", "error");
        return;
    }

    if (!shopName) {
        showToast("Please enter shop name", "error");
        return;
    }

    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        showToast("Please enter valid 10-digit mobile number", "error");
        return;
    }

    // Frontend duplicate check
    const existing = getSelectedShopFromInput();

    if (existing) {
        autofillShopDetails();
        showToast("Shop already exists for this village", "info");
        setSalesmanShopStatus("Shop already exists for selected village.", "info");
        return;
    }

    try {
        setSalesmanShopStatus("Adding shop to Firebase...");

        await fb.addDoc(
            fb.collection(fb.db, "shops"),
            {
                shopId: "SHOP-" + Date.now(),
                shopName,
                contactPerson,
                mobile,
                district,
                mandal,
                village,
                source: "web_app",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        );

        await syncShopsFromFirebase({ silent: true });

        const shopInput = document.getElementById("shop");
        if (shopInput) shopInput.value = shopName;

        autofillShopDetails();

        showToast("Shop added successfully", "success");
        setSalesmanShopStatus("Shop added and synced from Firebase.", "success");

    } catch (error) {
        console.error("Firebase add shop failed:", error);
        showToast("Shop add failed", "error");
        setSalesmanShopStatus("Shop add failed. Check Firebase rules/config.", "error");
    }
}
function loadShops() {
    // Called by location-dropdown-integration.js when location changes.
    resetShopSelection();
    renderShopOptions();
}

async function onVillageChanged() {
    const { district, mandal, village } = getSelectedSalesLocation();
    resetShopSelection();
    if (!district || !mandal || !village) {
        renderShopOptions();
        return;
    }
    await syncShopsFromFirebase({ silent: true });
}

function prefillCheckoutFromSalesmanBlock() {
    if (!isSalesmanMode) return;

    const selected = getSelectedShopFromInput();
    const { district, village } = getSelectedSalesLocation();
    const shopName = String(document.getElementById('shop')?.value || selected?.shopName || '').trim();
    const contactPerson = String(document.getElementById('salesContactPerson')?.value || selected?.contactPerson || '').trim();
    const mobile = String(document.getElementById('salesMobile')?.value || selected?.mobile || '').trim();

    const shopEl = document.getElementById('shopName');
    const contactEl = document.getElementById('contactPerson');
    const mobileEl = document.getElementById('mobile');
    const areaEl = document.getElementById('area');
    const townEl = document.getElementById('town');

    if (shopEl && shopName) shopEl.value = shopName;
    if (contactEl && contactPerson) contactEl.value = contactPerson;
    if (mobileEl && mobile) mobileEl.value = mobile;
    if (areaEl && village) areaEl.value = village;
    if (townEl && district) townEl.value = district;
}

function appendSalesmanContextToMessage(msg) {
    if (!isSalesmanMode) return msg;

    const selected = getSelectedShopFromInput();
    const { district, mandal, village } = getSelectedSalesLocation();
    const shopName = String(document.getElementById('shop')?.value || selected?.shopName || '').trim();
    const contactPerson = String(document.getElementById('salesContactPerson')?.value || selected?.contactPerson || '').trim();
    const mobile = String(document.getElementById('salesMobile')?.value || selected?.mobile || '').trim();

    if (!shopName && !district && !mandal && !village) return msg;

    msg += `\n\n━━━━━━━━━━━━━━━━━━━━\n🧑‍💼 *SALESMAN / ROUTE DETAILS*\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (shopName) msg += `🏪 *Selected Shop:* ${shopName}\n`;
    if (contactPerson) msg += `👤 *Contact Person:* ${contactPerson}\n`;
    if (mobile) msg += `📞 *Mobile:* ${mobile}\n`;
    if (village) msg += `📍 *Village:* ${village}\n`;
    if (mandal) msg += `📍 *Mandal:* ${mandal}\n`;
    if (district) msg += `📍 *District:* ${district}\n`;
    return msg;
}

function setupSalesmanShopMode() {
    if (!isSalesmanMode) return;

    shopMaster = getLocalShopMaster();
    renderShopOptions();

    document.getElementById('addNewShopBtn')?.addEventListener('click', addNewShopFromSalesmanBlock);
    document.getElementById('syncShopsBtn')?.addEventListener('click', () => syncShopsFromFirebase());
    document.getElementById('shop')?.addEventListener('change', autofillShopDetails);
    document.getElementById('shop')?.addEventListener('blur', autofillShopDetails);

    document.getElementById('district')?.addEventListener('change', () => {
        resetShopSelection();
        renderShopOptions();
    });
    document.getElementById('mandal')?.addEventListener('change', () => {
        resetShopSelection();
        renderShopOptions();
    });
    document.getElementById('village')?.addEventListener('change', onVillageChanged);

    syncShopsFromFirebase({ silent: true });
}

/* ============================================================
   CHECKOUT
   ============================================================ */
function proceedToCheckout() {
    const { totalUnits } = getCartSummary();
    if (totalUnits === 0) { showToast('Your cart is empty', 'error'); return; }
    closeCart();
    prefillCheckoutFromSalesmanBlock();
    const modal = document.getElementById('checkoutModal');
    if (modal) { modal.classList.add('show'); document.body.style.overflow = 'hidden'; }
}

// ✅ FIX 9: Cart bar "Order via WhatsApp" goes directly to checkout
function proceedToCheckoutDirect() {
    const { totalUnits } = getCartSummary();
    if (totalUnits === 0) { showToast('Your cart is empty', 'error'); return; }
    prefillCheckoutFromSalesmanBlock();
    const modal = document.getElementById('checkoutModal');
    if (modal) { modal.classList.add('show'); document.body.style.overflow = 'hidden'; }
}

function closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
}

function submitOrder(event) {
    event.preventDefault();
    const fields = {
        shopName:      document.getElementById('shopName'),
        contactPerson: document.getElementById('contactPerson'),
        mobile:        document.getElementById('mobile'),
        area:          document.getElementById('area'),
        town:          document.getElementById('town'),
        remarks:       document.getElementById('remarks')
    };

    let valid = true;
    Object.entries(fields).forEach(([k, el]) => {
        if (!el) return;
        el.classList.remove('error');
        if (k === 'remarks') return;
        if (!el.value.trim()) { el.classList.add('error'); valid = false; }
    });

    if (!valid) { showToast('Please fill all required fields', 'error'); return; }

    if (fields.mobile && !/^[6-9]\d{9}$/.test(fields.mobile.value.trim())) {
        if (fields.mobile) fields.mobile.classList.add('error');
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
    }

    const retailer = {
        shopName:      fields.shopName.value.trim(),
        contactPerson: fields.contactPerson.value.trim(),
        mobile:        fields.mobile.value.trim(),
        area:          fields.area.value.trim(),
        town:          fields.town.value.trim(),
        remarks:       fields.remarks ? fields.remarks.value.trim() : ''
    };

    const message = buildWhatsAppMessage(retailer);
    const summary = getCartSummary();

    saveOrderToHistory({
        shop: retailer.shopName,
        mobile: retailer.mobile,
        contact: retailer.contactPerson,
        area: retailer.area,
        town: retailer.town,
        remarks: retailer.remarks,
        total: summary.grandTotal,
        items: summary.totalUnits,
        cartons: summary.totalCartonsCount,
        singles: summary.totalSinglesCount,
        savings: summary.totalSavings,
        lines: summary.lines.map(l => ({
            name: l.product.name,
            nameTelugu: l.product.nameTelugu,
            brand: l.product.brand,
            packSize: l.product.packSize,
            unitType: l.unitType,
            qty: l.qty,
            rate: l.rate,
            amount: l.amount
        })),
        date: new Date().toISOString()
    });

    const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    showToast('Opening WhatsApp...', 'success');
    window.open(url, '_blank');

    // ✅ FIX 11: Clear cart after order is submitted
    state.cart = {};
    saveCartToStorage();
    updateCartUI();
    renderProducts();
    closeCheckout();

    // Reset form
    const form = document.getElementById('checkoutForm');
    if (form) form.reset();
}

function saveOrderToHistory(order) {
    try {
        const raw = localStorage.getItem(CONFIG.ORDERS_KEY);
        const orders = raw ? JSON.parse(raw) : [];
        orders.unshift(order);
        if (orders.length > 100) orders.length = 100;
        localStorage.setItem(CONFIG.ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {}
}

function buildWhatsAppMessage(retailer) {
    const { lines, grandTotal, totalMrp, totalSavings, totalUnits, totalCartonsCount, totalSinglesCount } = getCartSummary();
    const bar = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';

    let msg = `*\uD83E\uDDFE SRK ENTERPRISES ORDER*\n${bar}\n\n`;
    msg += `\uD83C\uDFEA *Shop:* ${retailer.shopName}\n`;
    msg += `\uD83D\uDC64 *Contact:* ${retailer.contactPerson}\n`;
    msg += `\uD83D\uDCDE *Mobile:* ${retailer.mobile}\n`;
    msg += `\uD83D\uDCCD *Area:* ${retailer.area}\n`;
    msg += `\uD83C\uDFD9 *Town:* ${retailer.town}\n\n`;
    msg += `${bar}\n\uD83D\uDCE6 *ORDER DETAILS*\n${bar}\n\n`;

    lines.forEach((line, idx) => {
        const p = line.product;
        const ct = p.cartonType || 'Carton';
        msg += `${idx + 1}. *${p.name}* (${p.packSize})\n`;
        if (p.nameTelugu) msg += `   ${p.nameTelugu}\n`;
        if (line.unitType === 'carton') {
            const totalUnitsCalc = line.qty * (p.unitsPerCarton || 1);
            msg += `   \uD83D\uDC49 ${line.qty} ${ct.toLowerCase()}${line.qty > 1 ? 's' : ''} (${totalUnitsCalc} units)\n`;
            msg += `   \uD83D\uDCB8 \u20B9${line.rate} / ${ct.toLowerCase()}\n`;
        } else {
            msg += `   \uD83D\uDC49 ${line.qty} pcs\n`;
            msg += `   \uD83D\uDCB8 \u20B9${line.rate} / pc\n`;
        }
        msg += `   \u2705 \u20B9${line.amount.toLocaleString('en-IN')}\n\n`;
    });

    msg += `${bar}\n\uD83D\uDCCA *SUMMARY*\n${bar}\n\n`;
    if (totalCartonsCount > 0) msg += `\uD83D\uDCE6 Cartons: ${totalCartonsCount}\n`;
    if (totalSinglesCount > 0) msg += `\uD83E\uDDFE Pieces: ${totalSinglesCount}\n`;
    msg += `\uD83D\uDCE6 Total Items: ${totalUnits}\n\n`;
    if (totalSavings > 0) {
        msg += `\uD83D\uDCB0 MRP Total: \u20B9${totalMrp.toLocaleString('en-IN')}\n`;
        msg += `\uD83C\uDF89 You Save: \u20B9${totalSavings.toLocaleString('en-IN')}\n\n`;
    }
    msg += `\uD83D\uDCB5 *GRAND TOTAL: \u20B9${grandTotal.toLocaleString('en-IN')}*\n${bar}\n`;
    if (retailer.remarks) msg += `\n\uD83D\uDCDD *Remarks:*\n${retailer.remarks}\n`;
    msg += `\n${new Date().toLocaleString('en-IN')}\n`;
    // ✅ FIX 7: Fixed "buisiness" typo → "business"
    msg = appendSalesmanContextToMessage(msg);
    msg += `*THANK YOU* for choosing *SRK Enterprises* as your business partner`;

    return msg;
}

/* ============================================================
   UTILITY
   ============================================================ */
function showHome() { clearAllFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ✅ FIX 8: Module-level timer variable instead of function property
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.toggle('hidden', !show);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function openImageZoom(imageUrl) {
    const modal = document.getElementById('imageZoomModal');
    const img = document.getElementById('zoomedImage');
    if (modal && img) { img.src = imageUrl; modal.classList.add('show'); }
}

function closeImageZoom() {
    const modal = document.getElementById('imageZoomModal');
    if (modal) modal.classList.remove('show');
}

// Close modals on backdrop click or Escape key
document.addEventListener('click', (e) => {
    if (e.target.id === 'cartModal') closeCart();
    if (e.target.id === 'checkoutModal') closeCheckout();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); closeCheckout(); closeImageZoom(); }
});
