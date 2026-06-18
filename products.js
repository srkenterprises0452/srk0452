/* SRK ENTERPRISES - PRODUCT CATALOGUE v5.0
   - Brands: Reliance Independence + Surya Masale
   - Telugu names included
   - Carton + Single pricing logic
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

const DEFAULT_BRANDS = [
    { id: 'brand-001', name: 'Reliance Independence', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d', logo: '', featured: true },
    { id: 'brand-002', name: 'Surya Masale', nameTelugu: '\u0c38\u0c42\u0c30\u0c4d\u0c2f \u0c2e\u0c38\u0c3e\u0c32\u0c47', logo: '', featured: true }
];

const PRODUCTS = [
    /* ---------- EDIBLE OIL (Reliance Independence) - both, default=carton, 12/carton ---------- */
    { id: 'oil-001', category: 'Edible Oil', brand: 'Reliance Independence', name: 'Reliance Independence Sunflower Oil', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c38\u0c28\u0c4d\u200c\u0c2b\u0c4d\u0c32\u0c35\u0c30\u0c4d \u0c06\u0c2f\u0c3f\u0c32\u0c4d', packSize: '1L Pouch', image: '', emoji: '\ud83c\udf3b', allowSingle: true, allowCarton: true, defaultUnit: 'carton', singleMrp: 175, singlePrice: 150, singlePrice_1_4: 150, singlePrice_5_9: 145, singlePrice_10_plus: 140, cartonType: 'Carton', unitsPerCarton: 12, cartonMrp: 2100, cartonPrice_1_4: 1680, cartonPrice_5_9: 1620, cartonPrice_10_plus: 1560, description: 'Carton contains 12 x 1L bottles', stockStatus: 'in' },
    { id: 'oil-002', category: 'Edible Oil', brand: 'Reliance Independence', name: 'Reliance Independence Premium Oil', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c2a\u0c4d\u0c30\u0c40\u0c2e\u0c3f\u0c2f\u0c02 \u0c06\u0c2f\u0c3f\u0c32\u0c4d', packSize: '1L Bottle', image: '', emoji: '\ud83e\uded2', allowSingle: true, allowCarton: true, defaultUnit: 'carton', singleMrp: 235, singlePrice: 200, singlePrice_1_4: 200, singlePrice_5_9: 195, singlePrice_10_plus: 188, cartonType: 'Carton', unitsPerCarton: 12, cartonMrp: 2820, cartonPrice_1_4: 2280, cartonPrice_5_9: 2200, cartonPrice_10_plus: 2120, description: 'Carton contains 12 x 1L bottles', stockStatus: 'in' },
    { id: 'oil-003', category: 'Edible Oil', brand: 'Reliance Independence', name: 'Reliance Independence Mustard Oil', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c06\u0c35 \u0c28\u0c42\u0c28\u0c46', packSize: '1L Pouch', image: '', emoji: '\ud83c\udf3c', allowSingle: true, allowCarton: true, defaultUnit: 'carton', singleMrp: 195, singlePrice: 170, singlePrice_1_4: 170, singlePrice_5_9: 165, singlePrice_10_plus: 158, cartonType: 'Carton', unitsPerCarton: 12, cartonMrp: 2340, cartonPrice_1_4: 1980, cartonPrice_5_9: 1900, cartonPrice_10_plus: 1820, description: 'Carton contains 12 x 1L pouches', stockStatus: 'in' },
    /* ---------- ATTA (Reliance Independence) - carton only ---------- */
    { id: 'atta-001', category: 'Atta', brand: 'Reliance Independence', name: 'Reliance Independence Whole Wheat Atta', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c17\u0c4b\u0c27\u0c41\u0c2e \u0c2a\u0c3f\u0c02\u0c21\u0c3f', packSize: '5kg', image: '', emoji: '\ud83c\udf3e', allowSingle: false, allowCarton: true, defaultUnit: 'carton', singleMrp: 340, singlePrice: 0, singlePrice_1_4: 0, singlePrice_5_9: 0, singlePrice_10_plus: 0, cartonType: 'Bag', unitsPerCarton: 10, cartonMrp: 3400, cartonPrice_1_4: 2850, cartonPrice_5_9: 2750, cartonPrice_10_plus: 2650, description: 'Bag contains 10 x 5kg packets', stockStatus: 'in' },
    { id: 'atta-002', category: 'Atta', brand: 'Reliance Independence', name: 'Reliance Independence Chakki Fresh Atta', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c1a\u0c15\u0c4d\u0c15\u0c40 \u0c2b\u0c4d\u0c30\u0c46\u0c37\u0c4d \u0c2a\u0c3f\u0c02\u0c21\u0c3f', packSize: '5kg', image: '', emoji: '\ud83c\udf3e', allowSingle: false, allowCarton: true, defaultUnit: 'carton', singleMrp: 325, singlePrice: 0, singlePrice_1_4: 0, singlePrice_5_9: 0, singlePrice_10_plus: 0, cartonType: 'Bag', unitsPerCarton: 10, cartonMrp: 3250, cartonPrice_1_4: 2750, cartonPrice_5_9: 2650, cartonPrice_10_plus: 2550, description: 'Bag contains 10 x 5kg packets', stockStatus: 'in' },
  
    /* ---------- SALT (Reliance Independence) ---------- */
    { id: 'salt-001', category: 'Salt', brand: 'Reliance Independence', name: 'Reliance Independence Iodized Salt', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c05\u0c2f\u0c4b\u0c21\u0c48\u0c1c\u0c4d\u0c21\u0c4d \u0c09\u0c2a\u0c4d\u0c2a\u0c41', packSize: '1kg', image: '', emoji: '\ud83e\uddc2', allowSingle: true, allowCarton: false, defaultUnit: 'single', singleMrp: 35, singlePrice: 28, singlePrice_1_4: 28, singlePrice_5_9: 26, singlePrice_10_plus: 24, cartonType: 'Bag', unitsPerCarton: 0, cartonMrp: 0, cartonPrice_1_4: 0, cartonPrice_5_9: 0, cartonPrice_10_plus: 0, description: 'Single 1kg packet', stockStatus: 'in' },
    { id: 'salt-002', category: 'Salt', brand: 'Reliance Independence', name: 'Reliance Independence Premium Salt', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c2a\u0c4d\u0c30\u0c40\u0c2e\u0c3f\u0c2f\u0c02 \u0c09\u0c2a\u0c4d\u0c2a\u0c41', packSize: '1kg', image: '', emoji: '\ud83e\uddc2', allowSingle: true, allowCarton: false, defaultUnit: 'single', singleMrp: 38, singlePrice: 30, singlePrice_1_4: 30, singlePrice_5_9: 28, singlePrice_10_plus: 26, cartonType: 'Bag', unitsPerCarton: 0, cartonMrp: 0, cartonPrice_1_4: 0, cartonPrice_5_9: 0, cartonPrice_10_plus: 0, description: 'Single 1kg packet', stockStatus: 'in' },
  
    /* ---------- RICE (Reliance Independence) ---------- */
    { id: 'rice-001', category: 'Rice', brand: 'Reliance Independence', name: 'Reliance Independence Basmati Rice', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c2c\u0c3e\u0c38\u0c4d\u0c2e\u0c24\u0c3f \u0c2c\u0c3f\u0c2f\u0c4d\u0c2f\u0c02', packSize: '5kg', image: '', emoji: '\ud83c\udf5a', allowSingle: false, allowCarton: true, defaultUnit: 'carton', singleMrp: 850, singlePrice: 0, singlePrice_1_4: 0, singlePrice_5_9: 0, singlePrice_10_plus: 0, cartonType: 'Bag', unitsPerCarton: 10, cartonMrp: 8500, cartonPrice_1_4: 7200, cartonPrice_5_9: 6950, cartonPrice_10_plus: 6700, description: 'Bag contains 10 x 5kg packets', stockStatus: 'in' },
    { id: 'rice-002', category: 'Rice', brand: 'Reliance Independence', name: 'Reliance Independence Rozana Basmati Rice', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c30\u0c4b\u0c1c\u0c3e\u0c28\u0c3e \u0c2c\u0c3e\u0c38\u0c4d\u0c2e\u0c24\u0c3f', packSize: '5kg', image: '', emoji: '\ud83c\udf5a', allowSingle: false, allowCarton: true, defaultUnit: 'carton', singleMrp: 620, singlePrice: 0, singlePrice_1_4: 0, singlePrice_5_9: 0, singlePrice_10_plus: 0, cartonType: 'Bag', unitsPerCarton: 10, cartonMrp: 6200, cartonPrice_1_4: 5200, cartonPrice_5_9: 5000, cartonPrice_10_plus: 4800, description: 'Bag contains 10 x 5kg packets', stockStatus: 'in' },
    
    /* ---------- GHEE (Reliance Independence) ---------- */
    { id: 'ghee-001', category: 'Ghee', brand: 'Reliance Independence', name: 'Reliance Independence Pure Cow Ghee', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c38\u0c4d\u0c35\u0c1a\u0c4d\u0c1b\u0c2e\u0c48\u0c28 \u0c06\u0c35\u0c41 \u0c28\u0c46\u0c2f\u0c4d\u0c2f\u0c3f', packSize: '1L Tin', image: '', emoji: '\ud83e\uddc8', allowSingle: true, allowCarton: true, defaultUnit: 'carton', singleMrp: 815, singlePrice: 720, singlePrice_1_4: 720, singlePrice_5_9: 695, singlePrice_10_plus: 670, cartonType: 'Carton', unitsPerCarton: 12, cartonMrp: 9780, cartonPrice_1_4: 8200, cartonPrice_5_9: 7950, cartonPrice_10_plus: 7700, description: 'Carton contains 12 x 1L tins', stockStatus: 'in' },
    { id: 'ghee-002', category: 'Ghee', brand: 'Reliance Independence', name: 'Reliance Independence Nandini Ghee', nameTelugu: '\u0c30\u0c3f\u0c32\u0c2f\u0c28\u0c4d\u0c38\u0c4d \u0c07\u0c02\u0c21\u0c3f\u0c2a\u0c46\u0c02\u0c21\u0c46\u0c28\u0c4d\u0c38\u0c4d \u0c28\u0c02\u0c26\u0c3f\u0c28\u0c3f \u0c28\u0c46\u0c2f\u0c4d\u0c2f\u0c3f', packSize: '1L Jar', image: '', emoji: '\ud83e\uddc8', allowSingle: true, allowCarton: true, defaultUnit: 'carton', singleMrp: 775, singlePrice: 680, singlePrice_1_4: 680, singlePrice_5_9: 660, singlePrice_10_plus: 640, cartonType: 'Carton', unitsPerCarton: 12, cartonMrp: 9300, cartonPrice_1_4: 7800, cartonPrice_5_9: 7560, cartonPrice_10_plus: 7320, description: 'Carton contains 12 x 1L jars', stockStatus: 'in' },
   
    /* ---------- SPICES (Surya Masale) ---------- */
    { id: 'spice-001', category: 'Spices', brand: 'Surya Masale', name: 'Surya Masale Turmeric Powder', nameTelugu: '\u0c38\u0c42\u0c30\u0c4d\u0c2f \u0c2e\u0c38\u0c3e\u0c32\u0c47 \u0c2a\u0c38\u0c41\u0c2a\u0c41 \u0c2a\u0c4a\u0c21\u0c3f', packSize: '500g', image: '', emoji: '\ud83c\udf36\ufe0f', allowSingle: true, allowCarton: true, defaultUnit: 'single', singleMrp: 195, singlePrice: 170, singlePrice_1_4: 170, singlePrice_5_9: 162, singlePrice_10_plus: 155, cartonType: 'Carton', unitsPerCarton: 24, cartonMrp: 4680, cartonPrice_1_4: 3900, cartonPrice_5_9: 3750, cartonPrice_10_plus: 3600, description: 'Carton contains 24 x 500g packets', stockStatus: 'in' },
    { id: 'spice-002', category: 'Spices', brand: 'Surya Masale', name: 'Surya Masale Red Chilli Powder', nameTelugu: '\u0c38\u0c42\u0c30\u0c4d\u0c2f \u0c2e\u0c38\u0c3e\u0c32\u0c47 \u0c0e\u0c30\u0c4d\u0c30 \u0c2e\u0c3f\u0c30\u0c2a\u0c15\u0c3e\u0c2f \u0c2a\u0c4a\u0c21\u0c3f', packSize: '500g', image: '', emoji: '\ud83c\udf36\ufe0f', allowSingle: true, allowCarton: true, defaultUnit: 'single', singleMrp: 290, singlePrice: 250, singlePrice_1_4: 250, singlePrice_5_9: 240, singlePrice_10_plus: 230, cartonType: 'Carton', unitsPerCarton: 24, cartonMrp: 6960, cartonPrice_1_4: 5800, cartonPrice_5_9: 5600, cartonPrice_10_plus: 5400, description: 'Carton contains 24 x 500g packets', stockStatus: 'in' },
    { id: 'spice-003', category: 'Spices', brand: 'Surya Masale', name: 'Surya Masale Coriander Powder', nameTelugu: '\u0c38\u0c42\u0c30\u0c4d\u0c2f \u0c2e\u0c38\u0c3e\u0c32\u0c47 \u0c27\u0c28\u0c3f\u0c2f\u0c3e\u0c32 \u0c2a\u0c4a\u0c21\u0c3f', packSize: '500g', image: '', emoji: '\ud83c\udf3f', allowSingle: true, allowCarton: true, defaultUnit: 'single', singleMrp: 165, singlePrice: 140, singlePrice_1_4: 140, singlePrice_5_9: 133, singlePrice_10_plus: 125, cartonType: 'Carton', unitsPerCarton: 24, cartonMrp: 3960, cartonPrice_1_4: 3200, cartonPrice_5_9: 3080, cartonPrice_10_plus: 2950, description: 'Carton contains 24 x 500g packets', stockStatus: 'in' },
    { id: 'spice-004', category: 'Spices', brand: 'Surya Masale', name: 'Surya Masale Garam Masala', nameTelugu: '\u0c38\u0c42\u0c30\u0c4d\u0c2f \u0c2e\u0c38\u0c3e\u0c32\u0c47 \u0c17\u0c30\u0c02 \u0c2e\u0c38\u0c3e\u0c32\u0c3e', packSize: '100g', image: '', emoji: '\ud83c\udf36\ufe0f', allowSingle: true, allowCarton: true, defaultUnit: 'single', singleMrp: 90, singlePrice: 78, singlePrice_1_4: 78, singlePrice_5_9: 73, singlePrice_10_plus: 68, cartonType: 'Carton', unitsPerCarton: 100, cartonMrp: 9000, cartonPrice_1_4: 7300, cartonPrice_5_9: 6900, cartonPrice_10_plus: 6500, description: 'Carton contains 100 x 100g packets', stockStatus: 'in' },
    { id: 'spice-005', category: 'Spices', brand: 'Surya Masale', name: 'Surya Masale Cumin Seeds', nameTelugu: '\u0c38\u0c42\u0c30\u0c4d\u0c2f \u0c2e\u0c38\u0c3e\u0c32\u0c47 \u0c1c\u0c40\u0c32\u0c15\u0c30\u0c4d\u0c30 \u0c17\u0c3f\u0c02\u0c1c\u0c32\u0c41', packSize: '200g', image: '', emoji: '\ud83c\udf30', allowSingle: true, allowCarton: true, defaultUnit: 'single', singleMrp: 175, singlePrice: 150, singlePrice_1_4: 150, singlePrice_5_9: 142, singlePrice_10_plus: 135, cartonType: 'Carton', unitsPerCarton: 50, cartonMrp: 8750, cartonPrice_1_4: 7000, cartonPrice_5_9: 6700, cartonPrice_10_plus: 6400, description: 'Carton contains 50 x 200g packets', stockStatus: 'in' },
    { id: 'spice-006', category: 'Spices', brand: 'Surya Masale', name: 'Surya Masale Chicken Masala', nameTelugu: '\u0c38\u0c42\u0c30\u0c4d\u0c2f \u0c2e\u0c38\u0c3e\u0c32\u0c47 \u0c1a\u0c3f\u0c15\u0c46\u0c28\u0c4d \u0c2e\u0c38\u0c3e\u0c32\u0c3e', packSize: '100g', image: '', emoji: '\ud83c\udf57', allowSingle: true, allowCarton: true, defaultUnit: 'single', singleMrp: 105, singlePrice: 88, singlePrice_1_4: 88, singlePrice_5_9: 83, singlePrice_10_plus: 78, cartonType: 'Carton', unitsPerCarton: 100, cartonMrp: 10500, cartonPrice_1_4: 8200, cartonPrice_5_9: 7800, cartonPrice_10_plus: 7400, description: 'Carton contains 100 x 100g packets', stockStatus: 'in' }
];

/* Default banners (pre-bundled with portal) */
const DEFAULT_BANNERS = [
    { id: 'banner-001', title: '', subtitle: '', image: 'banner-1.jpg', bgGradient: 'navy-orange', buttonText: 'Shop Now', isActive: true, order: 1, useOverlay: false },
    { id: 'banner-002', title: 'Reliance Independence Products', subtitle: 'Premium Quality at Wholesale Prices', image: 'banner-2.jpg', bgGradient: 'navy-green', buttonText: 'View All Products', isActive: true, order: 2, useOverlay: true }
];

const GOOGLE_SHEET_API_URL = '';

async function loadProductsFromGoogleSheet() {
    try {
        const adminProducts = localStorage.getItem('srk_admin_products');
        if (adminProducts) {
            const parsed = JSON.parse(adminProducts);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return PRODUCTS;
}

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
