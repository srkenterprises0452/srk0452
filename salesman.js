/* SRK Enterprises - Salesman Order Taking System
   Works standalone on GitHub Pages.
   Optional Google Sheet sync can be enabled by adding your Apps Script web app URL below.
*/

const CONFIG = {
  businessWhatsAppNumber: "919948000452", // Replace with SRK order receiving WhatsApp number, example: 919876543210
  googleAppsScriptUrl: "", // Optional: paste deployed Apps Script Web App URL here
  currencySymbol: "₹"
};

// 1) Location master. Extend this for your exact districts/mandals/villages.
const locationMaster = window.SRK_LOCATION_MASTER || {};


// 2) Initial shop master. Google Sheet/localStorage can add more shops later.
const defaultShops = [
  { id: "SHOP-1001", district: "Rajanna Sircilla", mandal: "Sircilla", village: "Sircilla Town", shopName: "Ramesh Kirana", mobile: "9876543210", ownerName: "Ramesh", address: "Main Road" },
  { id: "SHOP-1002", district: "Rajanna Sircilla", mandal: "Vemulawada", village: "Vemulawada Town", shopName: "Sri Lakshmi General Store", mobile: "9876500000", ownerName: "", address: "Temple Road" },
  { id: "SHOP-1003", district: "Siddipet", mandal: "Siddipet Urban", village: "Siddipet Town", shopName: "Mahesh Super Market", mobile: "9876511111", ownerName: "Mahesh", address: "Market Area" }
];

// 3) Product source. Uses your existing products.js if available; otherwise fallback sample.
function getProducts() {
  const external = window.products || window.PRODUCTS || window.productData;
  if (Array.isArray(external) && external.length) return external;
  return [
    { id: "P001", name: "Independence Sunflower Oil 1L", teluguName: "సన్‌ఫ్లవర్ ఆయిల్", brand: "Reliance Independence", category: "Oil", mrp: 150, price: 138, cartonPrice: 1580, cartonEnabled: true },
    { id: "P002", name: "Surya Chilli Powder 500g", teluguName: "కారం పొడి", brand: "Surya Masale", category: "Masala", mrp: 180, price: 160, cartonPrice: 1800, cartonEnabled: true },
    { id: "P003", name: "Surya Turmeric Powder 200g", teluguName: "పసుపు", brand: "Surya Masale", category: "Masala", mrp: 70, price: 62, cartonPrice: 700, cartonEnabled: true }
  ];
}

let shops = [];
let products = [];
let cart = [];

const $ = id => document.getElementById(id);
const money = n => `${CONFIG.currencySymbol}${Number(n || 0).toLocaleString("en-IN")}`;
const uid = prefix => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 999)}`;

function init() {
  products = normalizeProducts(getProducts());
  shops = loadLocal("srk_shops", defaultShops);
  cart = loadLocal("srk_sales_cart", []);

  $("salesmanName").value = localStorage.getItem("srk_salesman_name") || "";
  $("salesmanMobile").value = localStorage.getItem("srk_salesman_mobile") || "";

  bindEvents();
  loadDistricts();
  loadProductFilters();
  renderProducts();
  renderCart();
}

function normalizeProducts(items) {
  return items.map((p, index) => {
    const singleMrp = Number(p.singleMrp || p.mrp || p.MRP || 0);

    const singlePrice = Number(
      p.singlePrice ||
      p.singlePrice_1_4 ||
      p.price ||
      p.sellingPrice ||
      p.rate ||
      0
    );

    const cartonPrice = Number(
      p.cartonPrice ||
      p.cartonPrice_1_4 ||
      p.casePrice ||
      0
    );

    return {
      id: p.id || p.sku || `P-${index + 1}`,

      name: p.name || p.productName || "Unnamed Product",

      teluguName: p.nameTelugu || p.teluguName || p.telugu || "",

      brand: p.brand || "General",

      category: p.category || "General",

      mrp: singleMrp,

      price: singlePrice,

      cartonPrice: cartonPrice,

      cartonEnabled: Boolean(p.allowCarton || p.cartonEnabled || cartonPrice > 0),

      allowSingle: Boolean(p.allowSingle),

      allowCarton: Boolean(p.allowCarton),

      packSize: p.packSize || "",

      unitsPerCarton: Number(p.unitsPerCarton || 0),

      cartonType: p.cartonType || "Carton",

      image: p.image || "",

      stockStatus: p.stockStatus || "in",

      original: p
    };
  });
}

function bindEvents() {
  $("districtSelect").addEventListener("change", () => { loadMandals(); loadVillages(); loadShops(); });
  $("mandalSelect").addEventListener("change", () => { loadVillages(); loadShops(); });
  $("villageSelect").addEventListener("change", loadShops);
  $("shopSearch").addEventListener("change", showSelectedShop);
  $("addShopToggleBtn").addEventListener("click", () => $("newShopPanel").classList.toggle("hidden"));
  $("saveShopBtn").addEventListener("click", saveNewShop);
  $("productSearch").addEventListener("input", renderProducts);
  $("brandFilter").addEventListener("change", renderProducts);
  $("categoryFilter").addEventListener("change", renderProducts);
  $("clearCartBtn").addEventListener("click", clearCart);
  $("submitWhatsAppBtn").addEventListener("click", submitWhatsApp);
  $("submitSheetBtn").addEventListener("click", submitSheetOnly);
  $("syncBtn").addEventListener("click", syncFromSheet);
  $("salesmanName").addEventListener("input", e => localStorage.setItem("srk_salesman_name", e.target.value.trim()));
  $("salesmanMobile").addEventListener("input", e => localStorage.setItem("srk_salesman_mobile", e.target.value.trim()));
}

function loadDistricts() {
  const districts = Object.keys(locationMaster);
  $("districtSelect").innerHTML = districts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");
  loadMandals();
  loadVillages();
  loadShops();
}

function loadMandals() {
  const d = $("districtSelect").value;
  const mandals = Object.keys(locationMaster[d] || {});
  $("mandalSelect").innerHTML = mandals.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
}

function loadVillages() {
  const d = $("districtSelect").value;
  const m = $("mandalSelect").value;
  const villages = (locationMaster[d] && locationMaster[d][m]) || [];
  $("villageSelect").innerHTML = villages.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}

function loadShops() {
  const { district, mandal, village } = getSelectedLocation();
  const filtered = shops.filter(s => s.district === district && s.mandal === mandal && s.village === village);
  $("shopList").innerHTML = filtered.map(s => `<option value="${escapeHtml(s.shopName)}"></option>`).join("");
  $("shopSearch").value = "";
  $("selectedShopBox").classList.add("hidden");
}

function showSelectedShop() {
  const shop = getSelectedShop();
  const box = $("selectedShopBox");
  if (!shop) {
    box.innerHTML = "Shop not found in selected village. Use <b>+ Add New Shop</b> to onboard.";
    box.classList.remove("hidden");
    return;
  }
  box.innerHTML = `<b>${escapeHtml(shop.shopName)}</b><br>Mobile: ${escapeHtml(shop.mobile || "-")}<br>Owner: ${escapeHtml(shop.ownerName || "-")}<br>Address: ${escapeHtml(shop.address || "-")}`;
  box.classList.remove("hidden");
}

function saveNewShop() {
  const { district, mandal, village } = getSelectedLocation();
  const shopName = $("newShopName").value.trim();
  const mobile = $("newShopMobile").value.trim();
  const ownerName = $("newOwnerName").value.trim();
  const address = $("newShopAddress").value.trim();

  if (!shopName) return setStatus("Please enter shop name.", true);
  if (!/^\d{10}$/.test(mobile)) return setStatus("Please enter valid 10 digit mobile number.", true);

  const duplicate = shops.find(s =>
    s.district === district && s.mandal === mandal && s.village === village &&
    s.shopName.toLowerCase() === shopName.toLowerCase()
  );
  if (duplicate) return setStatus("This shop already exists in selected village.", true);

  const newShop = { id: uid("SHOP"), district, mandal, village, shopName, mobile, ownerName, address, createdAt: new Date().toISOString() };
  shops.push(newShop);
  saveLocal("srk_shops", shops);
  loadShops();
  $("shopSearch").value = shopName;
  showSelectedShop();
  $("newShopPanel").classList.add("hidden");
  ["newShopName", "newShopMobile", "newOwnerName", "newShopAddress"].forEach(id => $(id).value = "");
  setStatus("Shop onboarded successfully.");

  if (CONFIG.googleAppsScriptUrl) {
    postToSheet({ type: "shop", payload: newShop }).catch(() => setStatus("Shop saved locally. Sheet sync failed.", true));
  }
}

function getSelectedLocation() {
  return {
    district: $("districtSelect").value,
    mandal: $("mandalSelect").value,
    village: $("villageSelect").value
  };
}

function getSelectedShop() {
  const name = $("shopSearch").value.trim().toLowerCase();
  const loc = getSelectedLocation();
  return shops.find(s =>
    s.district === loc.district && s.mandal === loc.mandal && s.village === loc.village &&
    s.shopName.toLowerCase() === name
  );
}

function loadProductFilters() {
  const brands = ["All", ...new Set(products.map(p => p.brand))];
  const categories = ["All", ...new Set(products.map(p => p.category))];
  $("brandFilter").innerHTML = brands.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");
  $("categoryFilter").innerHTML = categories.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");
}

function renderProducts() {
  const search = $("productSearch").value.trim().toLowerCase();
  const brand = $("brandFilter").value;
  const category = $("categoryFilter").value;
  const filtered = products.filter(p =>
    (brand === "All" || p.brand === brand) &&
    (category === "All" || p.category === category) &&
    (`${p.name} ${p.teluguName} ${p.brand} ${p.category}`.toLowerCase().includes(search))
  );

  $("productList").innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-title">${escapeHtml(p.name)} ${p.teluguName ? `<span>(${escapeHtml(p.teluguName)})</span>` : ""}</div>
      <div class="product-meta"><span>${escapeHtml(p.brand)}</span><span>${escapeHtml(p.category)}</span></div>
      <div class="price-row">
<span class="price-tag">MRP ${money(p.mrp)}</span>

${p.allowSingle ? `<span class="price-tag">PCS ${money(p.price)}</span>` : ""}

${p.cartonEnabled ? `<span class="price-tag">${p.cartonType || "Carton"} ${money(p.cartonPrice)}</span>` : ""}
      </div>
      <div class="qty-row">
<label>
  PCS
  <input id="pcs-${p.id}" type="number" min="0" value="0" ${p.allowSingle ? "" : "disabled"}>
</label>

<label>
  ${p.cartonType || "Cartons"}
  <input id="ctn-${p.id}" type="number" min="0" value="0" ${p.cartonEnabled ? "" : "disabled"}>
</label>
        <button type="button" onclick="addToCart('${escapeJs(p.id)}')">Add</button>
      </div>
    </article>
  `).join("") || `<p class="empty">No products found.</p>`;
}

window.addToCart = function(productId) {
  const product = products.find(p => String(p.id) === String(productId));
  const pcs = Number($(`pcs-${productId}`).value || 0);
  const cartons = Number($(`ctn-${productId}`).value || 0);
  if (!product || (pcs <= 0 && cartons <= 0)) return setStatus("Enter PCS or Carton quantity before adding.", true);

  const lineTotal = (pcs * product.price) + (cartons * product.cartonPrice);
  const item = {
    lineId: uid("LINE"), productId: product.id, name: product.name, teluguName: product.teluguName,
    brand: product.brand, category: product.category, pcs, cartons,
    pcsRate: product.price, cartonRate: product.cartonPrice, lineTotal
  };
  cart.push(item);
  saveLocal("srk_sales_cart", cart);
  $(`pcs-${productId}`).value = 0;
  $(`ctn-${productId}`).value = 0;
  renderCart();
  setStatus("Product added to cart.");
};

function renderCart() {
  const list = $("cartList");
  if (!cart.length) {
    list.className = "cart-list empty";
    list.innerHTML = "No products added yet.";
  } else {
    list.className = "cart-list";
    list.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-main"><strong>${escapeHtml(item.name)}</strong><strong>${money(item.lineTotal)}</strong></div>
        <div class="cart-sub">PCS: ${item.pcs} x ${money(item.pcsRate)} | Cartons: ${item.cartons} x ${money(item.cartonRate)}</div>
        <div class="cart-actions"><button type="button" class="remove-btn" onclick="removeCartItem('${item.lineId}')">Remove</button></div>
      </div>
    `).join("");
  }
  $("cartItemsCount").textContent = cart.length;
  $("grandTotal").textContent = money(cart.reduce((sum, x) => sum + Number(x.lineTotal || 0), 0));
}

window.removeCartItem = function(lineId) {
  cart = cart.filter(x => x.lineId !== lineId);
  saveLocal("srk_sales_cart", cart);
  renderCart();
};

function clearCart() {
  cart = [];
  saveLocal("srk_sales_cart", cart);
  renderCart();
  setStatus("Cart cleared.");
}

function buildOrder() {
  const salesmanName = $("salesmanName").value.trim();
  if (!salesmanName) throw new Error("Enter salesman name.");
  if (!cart.length) throw new Error("Cart is empty.");
  const shop = getSelectedShop();
  if (!shop) throw new Error("Select an existing shop or onboard new shop first.");

  const order = {
    orderId: uid("ORD"),
    createdAt: new Date().toISOString(),
    salesmanName,
    salesmanMobile: $("salesmanMobile").value.trim(),
    location: getSelectedLocation(),
    shop,
    items: cart,
    total: cart.reduce((sum, x) => sum + Number(x.lineTotal || 0), 0)
  };
  return order;
}

function submitWhatsApp() {
  try {
    const order = buildOrder();
    const msg = formatWhatsAppMessage(order);
    if (CONFIG.googleAppsScriptUrl) {
      postToSheet({ type: "order", payload: order }).catch(() => console.warn("Sheet save failed"));
    }
    window.open(`https://wa.me/${CONFIG.businessWhatsAppNumber}?text=${encodeURIComponent(msg)}`, "_blank");
    localStorage.setItem("srk_last_order", JSON.stringify(order));
    clearCart();
  } catch (e) {
    setStatus(e.message, true);
  }
}

async function submitSheetOnly() {
  try {
    if (!CONFIG.googleAppsScriptUrl) throw new Error("Google Apps Script URL is not configured.");
    const order = buildOrder();
    await postToSheet({ type: "order", payload: order });
    localStorage.setItem("srk_last_order", JSON.stringify(order));
    clearCart();
    setStatus("Order saved to Google Sheet.");
  } catch (e) {
    setStatus(e.message, true);
  }
}

function formatWhatsAppMessage(order) {
  const lines = [];
  lines.push("🛒 SRK ENTERPRISES ORDER");
  lines.push(`Order ID: ${order.orderId}`);
  lines.push(`Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`);
  lines.push("");
  lines.push(`Salesman: ${order.salesmanName}`);
  if (order.salesmanMobile) lines.push(`Salesman Mobile: ${order.salesmanMobile}`);
  lines.push("");
  lines.push(`Shop: ${order.shop.shopName}`);
  lines.push(`Mobile: ${order.shop.mobile}`);
  lines.push(`District: ${order.location.district}`);
  lines.push(`Mandal: ${order.location.mandal}`);
  lines.push(`Village: ${order.location.village}`);
  lines.push("");
  lines.push("Items:");
  order.items.forEach((i, idx) => {
    lines.push(`${idx + 1}. ${i.name}`);
    lines.push(`   PCS: ${i.pcs} | Cartons: ${i.cartons} | Amount: ${money(i.lineTotal)}`);
  });
  lines.push("");
  lines.push(`Grand Total: ${money(order.total)}`);
  return lines.join("\n");
}

async function postToSheet(data) {
  const res = await fetch(CONFIG.googleAppsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res;
}

async function syncFromSheet() {
  if (!CONFIG.googleAppsScriptUrl) return setStatus("Google Apps Script URL is not configured. Using local shops only.", true);
  try {
    const res = await fetch(`${CONFIG.googleAppsScriptUrl}?type=shops`);
    const data = await res.json();
    if (Array.isArray(data.shops)) {
      shops = data.shops;
      saveLocal("srk_shops", shops);
      loadShops();
      setStatus("Shop master synced.");
    } else {
      setStatus("No shop data received from sheet.", true);
    }
  } catch (e) {
    setStatus("Sync failed. Check Apps Script deployment and access.", true);
  }
}

function loadLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function setStatus(msg, isError = false) {
  const el = $("statusText");
  el.textContent = msg;
  el.style.color = isError ? "#b91c1c" : "#0f6b3f";
}
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}
function escapeJs(str) { return String(str).replace(/'/g, "\\'"); }

document.addEventListener("DOMContentLoaded", init);
