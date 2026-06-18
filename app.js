/* SRK ENTERPRISES - MAIN APPLICATION SCRIPT v5.0
   Features:
   - Dual filter (Brand + Category)
   - Banner carousel with auto-rotation
   - Carton + Single pricing
   - Mixed cart (single + carton items)
   - Telugu names
   - Wishlist
   - Order history saved for admin
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

async function init() {
    showLoader(true);
    state.products = await loadProductsFromGoogleSheet();
    state.brands = loadBrandsFromStorage();
    state.banners = loadBannersFromStorage().filter(b => b.isActive).sort((a, b) => (a.order || 0) - (b.order || 0));
    state.filteredProducts = state.products;
    loadCartFromStorage();
    loadWishlistFromStorage();
    loadProductUnitChoices();
    renderBanners();
    startBannerAutoRotation();
    renderBrandFilters();
    renderCategoryFilters();
    renderProducts();
    updateCartUI();
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    showLoader(false);
}

/* ============ BANNER CAROUSEL ============ */
function renderBanners() {
    const slidesEl = document.getElementById('bannerSlides');
    const dotsEl = document.getElementById('bannerDots');
    if (state.banners.length === 0) {
        // Fallback default banner
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
        document.querySelector('.banner-prev').style.display = 'none';
        document.querySelector('.banner-next').style.display = 'none';
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
        `<button class="banner-dot ${i === 0 ? 'active' : ''}" onclick="goToBanner(${i})" aria-label="Slide ${i+1}"></button>`
    ).join('');

    state.currentBanner = 0;
    updateBannerPosition();

    if (state.banners.length <= 1) {
        document.querySelector('.banner-prev').style.display = 'none';
        document.querySelector('.banner-next').style.display = 'none';
        dotsEl.style.display = 'none';
    }

    // Touch swipe support
    const carousel = document.getElementById('bannerCarousel');
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; stopBannerAutoRotation(); });
    carousel.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextBanner(); else prevBanner();
        }
        setTimeout(startBannerAutoRotation, 3000);
    });
    carousel.addEventListener('mouseenter', stopBannerAutoRotation);
    carousel.addEventListener('mouseleave', startBannerAutoRotation);
}

function updateBannerPosition() {
    const slidesEl = document.getElementById('bannerSlides');
    slidesEl.style.transform = `translateX(-${state.currentBanner * 100}%)`;
    document.querySelectorAll('.banner-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === state.currentBanner);
    });
}

function nextBanner() {
    state.currentBanner = (state.currentBanner + 1) % state.banners.length;
    updateBannerPosition();
}

function prevBanner() {
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

/* ============ DUAL FILTERS ============ */
function getAvailableBrands() {
    const set = new Set();
    state.products.forEach(p => set.add(p.brand));
    return [...set];
}

function getAvailableCategoriesForBrand(brand) {
    if (brand === 'All') return CATEGORIES.filter(c => c !== 'All');
    const set = new Set();
    state.products.filter(p => p.brand === brand).forEach(p => set.add(p.category));
    return [...set];
}

function renderBrandFilters() {
    const nav = document.getElementById('brandNav');
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
    const availableCats = getAvailableCategoriesForBrand(state.activeBrand);
    const allPill = `<button class="filter-pill ${state.activeCategory === 'All' ? 'active' : ''}" onclick="setCategory('All')">All</button>`;
    const catPills = CATEGORIES.filter(c => c !== 'All' && availableCats.includes(c))
        .map(c => `<button class="filter-pill ${state.activeCategory === c ? 'active' : ''}" onclick="setCategory('${escapeJs(c)}')">${c}</button>`)
        .join('');
    nav.innerHTML = allPill + catPills;
}

function setBrand(brand) {
    state.activeBrand = brand;
    // Reset category if it's no longer available under this brand
    const availableCats = getAvailableCategoriesForBrand(brand);
    if (state.activeCategory !== 'All' && !availableCats.includes(state.activeCategory)) {
        state.activeCategory = 'All';
    }
    renderBrandFilters();
    renderCategoryFilters();
    applyFilters();
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setCategory(cat) {
    state.activeCategory = cat;
    renderCategoryFilters();
    applyFilters();
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearAllFilters() {
    state.activeBrand = 'All';
    state.activeCategory = 'All';
    state.searchTerm = '';
    document.getElementById('searchInput').value = '';
    renderBrandFilters();
    renderCategoryFilters();
    applyFilters();
}

function handleSearch(event) {
    state.searchTerm = event.target.value.trim().toLowerCase();
    applyFilters();
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

    // Active filter info
    const info = document.getElementById('activeFilterInfo');
    const text = document.getElementById('activeFilterText');
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

/* ============ PRODUCT RENDERING ============ */
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const emptyEl = document.getElementById('emptyResults');
    const info = document.getElementById('resultsInfo');

    if (state.filteredProducts.length === 0) {
        grid.innerHTML = '';
        emptyEl.classList.remove('hidden');
        info.textContent = '';
        return;
    }
    emptyEl.classList.add('hidden');
    info.textContent = `Showing ${state.filteredProducts.length} product${state.filteredProducts.length !== 1 ? 's' : ''}`;
    grid.innerHTML = state.filteredProducts.map(renderProductCard).join('');
}

function getProductUnit(p) {
    // Return chosen unit type or default
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
        if (qty >= 5)  return p.cartonPrice_5_9;
        return p.cartonPrice_1_4;
    }
    // Single
    if (p.allowCarton) {
        // Both enabled - use flat single price
        return p.singlePrice;
    }
    // Single only - use slabs
    if (qty >= 10) return p.singlePrice_10_plus;
    if (qty >= 5)  return p.singlePrice_5_9;
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

    const fallbackEmoji = p.emoji || '📦';

const imageBlock = p.image
    ? `<img 
          src="${escapeHtml(p.image)}" 
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
       />
       <span class="placeholder-emoji" style="display:none;">${fallbackEmoji}</span>`
    : `<span class="placeholder-emoji">${fallbackEmoji}</span>`;

    const stockBadge = isOut
        ? `<span class="stock-badge out">Out</span>`
        : `<span class="stock-badge">In Stock</span>`;

    const discountBadge = hasDiscount && !isOut
        ? `<span class="discount-badge">${discountPct}% OFF</span>`
        : '';

    const teluguLine = p.nameTelugu
        ? `<div class="product-name-telugu">${escapeHtml(p.nameTelugu)}</div>`
        : '';

    const descLine = p.description && currentUnit === 'carton'
        ? `<div class="product-desc">📦 ${escapeHtml(p.description)}</div>`
        : '';

    let unitToggle = '';
    if (p.allowSingle && p.allowCarton) {
        unitToggle = `
            <div class="unit-toggle">
                <button class="${currentUnit === 'single' ? 'active' : ''}" onclick="setProductUnit('${p.id}', 'single')">Single</button>
                <button class="${currentUnit === 'carton' ? 'active' : ''}" onclick="setProductUnit('${p.id}', 'carton')">${escapeHtml(p.cartonType || 'Carton')}</button>
            </div>
        `;
    }

    let tierHint = '';
    let tierTable = '';

    if (currentUnit === 'carton') {
        const ct = p.cartonType || 'Carton';

        tierHint = `<button class="tier-hint" onclick="toggleTierTable('${p.id}')">Buy 5+: ₹${p.cartonPrice_5_9}</button>`;

        tierTable = `
            <div class="tier-table" id="tier-${p.id}">
                <div class="tier-table-row ${displayQty >= 1 && displayQty <= 4 ? 'active' : ''}">
                    <span>1-4 ${ct.toLowerCase()}s</span>
                    <strong>₹${p.cartonPrice_1_4}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 5 && displayQty <= 9 ? 'active' : ''}">
                    <span>5-9 ${ct.toLowerCase()}s</span>
                    <strong>₹${p.cartonPrice_5_9}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 10 ? 'active' : ''}">
                    <span>10+ ${ct.toLowerCase()}s</span>
                    <strong>₹${p.cartonPrice_10_plus}</strong>
                </div>
            </div>
        `;
    } else if (!p.allowCarton) {
        tierHint = `<button class="tier-hint" onclick="toggleTierTable('${p.id}')">Buy 5+: ₹${p.singlePrice_5_9}</button>`;

        tierTable = `
            <div class="tier-table" id="tier-${p.id}">
                <div class="tier-table-row ${displayQty >= 1 && displayQty <= 4 ? 'active' : ''}">
                    <span>1-4 pcs</span>
                    <strong>₹${p.singlePrice_1_4}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 5 && displayQty <= 9 ? 'active' : ''}">
                    <span>5-9 pcs</span>
                    <strong>₹${p.singlePrice_5_9}</strong>
                </div>
                <div class="tier-table-row ${displayQty >= 10 ? 'active' : ''}">
                    <span>10+ pcs</span>
                    <strong>₹${p.singlePrice_10_plus}</strong>
                </div>
            </div>
        `;
    }

    let priceDisplay = `
        <div class="price-display">
            ${hasDiscount ? `
                <div class="mrp-line">MRP: <span class="mrp-value">₹${mrp}</span></div>
            ` : ''}
            <div class="current-price">
                ₹${currentRate}
                <span class="current-price-suffix">/${getUnitLabel(p, currentUnit).replace(/s$/, '')}</span>
            </div>
            ${tierHint}
            ${tierTable}
        </div>
    `;

    const unitLabel = getUnitLabel(p, currentUnit);

    return `
        <div class="product-card">
            <button class="heart-btn ${isFav ? 'active' : ''}" onclick="toggleWishlist('${p.id}')" aria-label="Wishlist">
                ${isFav ? '♥' : '♡'}
            </button>

            <div class="product-image">
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
                            <button class="qty-btn" onclick="decrementQtyInput('${p.id}')" ${isOut ? 'disabled' : ''}>−</button>
                            <input class="qty-input" id="qty-${p.id}" value="${displayQty}" inputmode="numeric" onchange="updateQtyInput('${p.id}', this.value)" ${isOut ? 'disabled' : ''} />
                            <button class="qty-btn" onclick="incrementQtyInput('${p.id}')" ${isOut ? 'disabled' : ''}>+</button>
                        </div>

                        <button class="btn-add ${inCart ? 'in-cart' : ''}" onclick="addToCart('${p.id}')" ${isOut ? 'disabled' : ''}>
                            ${isOut ? 'Out of Stock' : inCart ? '✓ Added' : 'Add to Cart'}
                        </button>
                    </div>

                    <div class="qty-unit-label">${unitLabel}</div>
                </div>
            </div>
        </div>
    `;
}
function toggleTierTable(productId) {

    // ✅ Close other open tables (clean UX)
    document.querySelectorAll('.tier-table').forEach(el => {
        if (el.id !== `tier-${productId}`) {
            el.classList.remove('show');
        }
    });

    // ✅ Toggle current one
    const table = document.getElementById(`tier-${productId}`);
    if (!table) return;

    table.classList.toggle('show');
}
function getUnitLabel(p, unitType) {
    if (unitType === 'carton') {
        const ct = p.cartonType || 'Carton';
        return ct.toLowerCase() + 's';
    }
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

/* ============ CART ============ */
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stockStatus === 'out') return;
    const unitType = getProductUnit(product);
    const qty = getQtyFromInput(productId);
    const key = `${productId}__${unitType}`;
    state.cart[key] = { productId, unitType, qty };
    saveCartToStorage();
    renderProducts();
    updateCartUI();
    const unitLabel = unitType === 'carton' ? (product.cartonType || 'Carton').toLowerCase() + 's' : 'pcs';
    showToast(`\u2713 Added ${qty} ${unitLabel} of ${product.name}`, 'success');
}

function toggleWishlist(productId) {
    if (state.wishlist[productId]) { delete state.wishlist[productId]; showToast('Removed from wishlist', 'info'); }
    else { state.wishlist[productId] = true; showToast('\u2665 Added to wishlist', 'success'); }
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
    if (state.cart[key]) { state.cart[key].qty++; saveCartToStorage(); renderCart(); updateCartUI(); renderProducts(); }
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
        // Clean up cart items whose products don't exist
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
    document.getElementById('cartBadge').textContent = totalUnits;
    const myCartTotal = document.getElementById('myCartTotal');
    if (myCartTotal) myCartTotal.textContent = `\u20B9${grandTotal.toLocaleString('en-IN')}`;
    const bottomBar = document.getElementById('bottomCartSummary');
    if (totalUnits > 0) {
        bottomBar.classList.remove('hidden');
        document.getElementById('bcsCount').textContent = `${totalUnits} item${totalUnits!==1?'s':''}`;
        document.getElementById('bcsTotal').textContent = `\u20B9${grandTotal.toLocaleString('en-IN')}`;
       const bcsAction = document.querySelector('.bcs-action');
if (bcsAction) bcsAction.textContent = 'Place Order';
    } else {
        bottomBar.classList.add('hidden');
    }
}

function openCart() { renderCart(); document.getElementById('cartModal').classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeCart() { document.getElementById('cartModal').classList.remove('show'); document.body.style.overflow = ''; }

function renderCart() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    const { totalUnits, totalCartonsCount, totalSinglesCount, grandTotal, totalMrp, totalSavings, lines } = getCartSummary();

    if (lines.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon">\uD83D\uDED2</div>
                <h3>Your cart is empty</h3>
                <p>Browse products and add items to get started.</p>
                <button class="btn-continue" onclick="closeCart()">Continue Shopping</button>
            </div>`;
        footer.innerHTML = '';
        return;
    }

    body.innerHTML = lines.map(({ key, product, unitType, qty, rate, mrp, amount }) => {
        const fallback = product.emoji || '\uD83D\uDCE6';
        const imageHtml = product.image
            ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.outerHTML='${fallback}';" />`
            : fallback;
        const unitLabel = unitType === 'carton' ? (product.cartonType || 'Carton').toLowerCase() + 's' : 'pcs';
        const unitsInfo = unitType === 'carton' && product.unitsPerCarton 
            ? ` (${qty * product.unitsPerCarton} units)` 
            : '';
        const teluguLine = product.nameTelugu ? `<div class="cart-item-name-te">${escapeHtml(product.nameTelugu)}</div>` : '';
        const mrpLine = mrp > rate ? `<span class="cart-item-mrp">\u20B9${mrp}</span>` : '';
        const unitBadge = `<span class="cart-item-unit-badge ${unitType}">${unitType.toUpperCase()}</span>`;

        return `
        <div class="cart-item">
            <div class="cart-item-img">${imageHtml}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(product.name)} ${unitBadge}</div>
                ${teluguLine}
                <div class="cart-item-meta">${escapeHtml(product.brand)} \u2022 ${escapeHtml(product.packSize)}</div>
                <div class="cart-item-rate">Rate: \u20B9${rate}/${unitLabel.slice(0, -1)} ${mrpLine}</div>
                <div class="cart-item-controls">
                    <div class="cart-qty-selector">
                        <button class="qty-btn" onclick="decrementCartItem('${key}')">\u2212</button>
                        <input type="number" class="qty-input" value="${qty}" min="1" onchange="updateCartItemQty('${key}', this.value)" />
                        <button class="qty-btn" onclick="incrementCartItem('${key}')">+</button>
                    </div>
                    <div class="cart-item-amount">\u20B9${amount.toLocaleString('en-IN')}${unitsInfo}</div>
                </div>
                <button class="cart-item-remove" onclick="removeCartItem('${key}')">Remove</button>
            </div>
        </div>`;
    }).join('');

    const savingsRow = totalSavings > 0 ? `<div class="cart-summary-row savings"><span>\uD83C\uDF89 You Save:</span><span>\u20B9${totalSavings.toLocaleString('en-IN')}</span></div>` : '';
    const mrpRow = totalSavings > 0 ? `<div class="cart-summary-row"><span>Total MRP:</span><span style="text-decoration:line-through; color:#999;">\u20B9${totalMrp.toLocaleString('en-IN')}</span></div>` : '';
    const breakdown = (totalCartonsCount > 0 && totalSinglesCount > 0)
        ? `<div class="cart-summary-row"><span>Cartons / Pieces:</span><span><strong>${totalCartonsCount} cartons + ${totalSinglesCount} pcs</strong></span></div>`
        : '';

    footer.innerHTML = `
        <div class="cart-summary">
            <div class="cart-summary-row"><span>Total Items:</span><span><strong>${totalUnits}</strong></span></div>
            ${breakdown}
            ${mrpRow}
            ${savingsRow}
            <div class="cart-summary-row"><span>Sub Total:</span><span>\u20B9${grandTotal.toLocaleString('en-IN')}</span></div>
            <div class="cart-summary-row total"><span>Grand Total:</span><span>\u20B9${grandTotal.toLocaleString('en-IN')}</span></div>
        </div>
        <button class="btn-checkout" onclick="proceedToCheckout()">Proceed to Checkout \u2192</button>
    `;
}

/* ============ CHECKOUT ============ */
function proceedToCheckout() {
    const { totalUnits } = getCartSummary();
    if (totalUnits === 0) { showToast('Your cart is empty', 'error'); return; }
    closeCart();
    document.getElementById('checkoutModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('show');
    document.body.style.overflow = '';
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
        el.classList.remove('error');
        if (k === 'remarks') return;
        if (!el.value.trim()) { el.classList.add('error'); valid = false; }
    });
    if (!valid) { showToast('Please fill all required fields', 'error'); return; }
    if (!/^[6-9]\d{9}$/.test(fields.mobile.value.trim())) {
        fields.mobile.classList.add('error');
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
    }

    const retailer = {
        shopName: fields.shopName.value.trim(),
        contactPerson: fields.contactPerson.value.trim(),
        mobile: fields.mobile.value.trim(),
        area: fields.area.value.trim(),
        town: fields.town.value.trim(),
        remarks: fields.remarks.value.trim()
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
    const bar = '\u2501'.repeat(22);
    let msg = '*SRK ENTERPRISES ORDER*\n';
    msg += bar + '\n\n';
    msg += `*Retailer:* ${retailer.shopName}\n`;
    msg += `*Contact:* ${retailer.contactPerson}\n`;
    msg += `*Mobile:* ${retailer.mobile}\n`;
    msg += `*Area:* ${retailer.area}\n`;
    msg += `*Town:* ${retailer.town}\n\n`;
    msg += bar + '\n';
    msg += '*ORDER DETAILS*\n';
    msg += bar + '\n\n';
    lines.forEach((line, idx) => {
        const p = line.product;
        const ct = p.cartonType || 'Carton';
        msg += `${idx + 1}. *${p.name}* (${p.packSize})\n`;
        if (p.nameTelugu) msg += `   ${p.nameTelugu}\n`;
        if (line.unitType === 'carton') {
            const totalUnits = line.qty * (p.unitsPerCarton || 1);
            msg += `   Order: ${line.qty} ${ct}${line.qty>1?'s':''} (${totalUnits} ${p.unitsPerCarton ? 'units' : ''})\n`;
            msg += `   Rate: \u20B9${line.rate}/${ct.toLowerCase()}\n`;
        } else {
            msg += `   Order: ${line.qty} pcs (single)\n`;
            msg += `   Rate: \u20B9${line.rate}/pc\n`;
        }
        msg += `   Amount: \u20B9${line.amount.toLocaleString('en-IN')}\n\n`;
    });
    msg += bar + '\n';
    if (totalCartonsCount > 0) msg += `*Cartons/Bags:* ${totalCartonsCount}\n`;
    if (totalSinglesCount > 0) msg += `*Single Pieces:* ${totalSinglesCount}\n`;
    msg += `*Total Items:* ${totalUnits}\n`;
    if (totalSavings > 0) {
        msg += `*Total MRP:* \u20B9${totalMrp.toLocaleString('en-IN')}\n`;
        msg += `*You Save:* \u20B9${totalSavings.toLocaleString('en-IN')} \uD83C\uDF89\n`;
    }
    msg += `*GRAND TOTAL: \u20B9${grandTotal.toLocaleString('en-IN')}*\n`;
    msg += bar + '\n';
    if (retailer.remarks) msg += `\n*Remarks:*\n${retailer.remarks}\n`;
    msg += `\nOrder placed via SRK Enterprises Portal\nDate: ${new Date().toLocaleString('en-IN')}`;
    return msg;
}

function showHome() { clearAllFilters(); window.scrollTo({top:0, behavior:'smooth'}); }

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2500);
}

function showLoader(show) { document.getElementById('loader').classList.toggle('hidden', !show); }

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeJs(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'cartModal') closeCart();
    if (e.target.id === 'checkoutModal') closeCheckout();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); closeCheckout(); }
});
