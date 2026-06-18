/*
SRK ENTERPRISES - PRODUCT CATALOGUE v5.1
Now supports:
- Google Sheet integration ✅
- Safe fallback ✅
- Data normalization ✅
*/

const CATEGORIES = ['All', 'Edible Oil', 'Atta', 'Salt', 'Rice', 'Ghee', 'Spices'];

const CATEGORIES_TELUGU = {
  'All': 'అన్నీ',
  'Edible Oil': 'నూనెలు',
  'Atta': 'పిండి',
  'Salt': 'ఉప్పు',
  'Rice': 'బియ్యం',
  'Ghee': 'నెయ్యి',
  'Spices': 'మసాలాలు'
};

// ✅ Default brands
const DEFAULT_BRANDS = [
  { id: 'brand-001', name: 'Reliance Independence', nameTelugu: '', logo: '', featured: true },
  { id: 'brand-002', name: 'Surya Masale', nameTelugu: '', logo: '', featured: true }
];

// ✅ Default minimal products (fallback)
const PRODUCTS = [];

// ✅ Default banners
const DEFAULT_BANNERS = [
  {
    id: 'banner-001',
    title: '',
    subtitle: '',
    image: 'banner-1.jpg',
    bgGradient: 'navy-orange',
    buttonText: 'Shop Now',
    isActive: true,
    order: 1,
    useOverlay: false
  },
  {
    id: 'banner-002',
    title: 'Reliance Independence Products',
    subtitle: 'Premium Quality at Wholesale Prices',
    image: 'banner-2.jpg',
    bgGradient: 'navy-green',
    buttonText: 'View All Products',
    isActive: true,
    order: 2,
    useOverlay: true
  }
];

// ✅ 🔴 PASTE YOUR API URL HERE
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzzeMgJxZo17bjPYSLj4GKPdfYke1HQv9pIoJ6xZT_FK7lLgsC3aLYw802Ax1M8_h-s/exec";


// ✅ ✅ MAIN DATA LOADER (FIXED VERSION)
async function loadProductsFromGoogleSheet() {
  try {

    // ✅ STEP 1: Fetch from sheet
      if (Array.isArray(data) && data.length > 0) {
        async function loadProductsFromGoogleSheet(controller) {
  const res = await fetch(GOOGLE_SHEET_API_URL, {
    signal: controller?.signal
  });

  const data = await res.json();

  return data.map(p => ({
    ...p,
    allowSingle: String(p.allowSingle).toLowerCase() === "true",
    allowCarton: String(p.allowCarton).toLowerCase() === "true",
    singleMrp: Number(p.singleMrp || 0),
    singlePrice: Number(p.singlePrice || 0)
  }));
}

        // ✅ STEP 2: Normalize data (CRITICAL FIX)
        return data.map(p => ({
          ...p,

          // ✅ Convert booleans
          allowSingle: String(p.allowSingle).toLowerCase() === "true",
          allowCarton: String(p.allowCarton).toLowerCase() === "true",

          // ✅ Convert numbers
          singleMrp: Number(p.singleMrp || 0),
          singlePrice: Number(p.singlePrice || 0),
          singlePrice_1_4: Number(p.singlePrice_1_4 || 0),
          singlePrice_5_9: Number(p.singlePrice_5_9 || 0),
          singlePrice_10_plus: Number(p.singlePrice_10_plus || 0),

          cartonMrp: Number(p.cartonMrp || 0),
          unitsPerCarton: Number(p.unitsPerCarton || 0),

          cartonPrice_1_4: Number(p.cartonPrice_1_4 || 0),
          cartonPrice_5_9: Number(p.cartonPrice_5_9 || 0),
          cartonPrice_10_plus: Number(p.cartonPrice_10_plus || 0),

          // ✅ Fix defaults
          defaultUnit: (p.defaultUnit === "carton") ? "carton" : "single"
        }));
      }
    }

    // ✅ STEP 3: Admin override
    const adminProducts = localStorage.getItem('srk_admin_products');
    if (adminProducts) {
      const parsed = JSON.parse(adminProducts);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

  } catch (e) {
    console.log("Sheet failed, using fallback", e);
  }

  // ✅ STEP 4: Final fallback
  return PRODUCTS;
}


// ✅ Load brands
function loadBrandsFromStorage() {
  try {
    const raw = localStorage.getItem('srk_admin_brands');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_BRANDS;
}

// ✅ Load banners
function loadBannersFromStorage() {
  try {
    const raw = localStorage.getItem('srk_admin_banners');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_BANNERS;
}
