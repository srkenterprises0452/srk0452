# SRK Enterprises - B2B FMCG Ordering Portal v5.0

> **Connecting Markets, Creating Futures**
> Professional B2B FMCG distribution portal with brand & banner management.

## 🆕 What's New in v5.0

### Core Features
- 🏷️ **Brand Management** - Add/Edit/Delete brands via admin (currently: Reliance Independence + Surya Masale)
- 🖼️ **Banner Carousel** - Up to 3 admin-managed banners with auto-rotation
- 🌐 **Telugu Names** - All 36 products have optional Telugu translations
- 📦 **Carton + Single Pricing** - B2B-grade pricing with separate carton/single options
- 🔍 **Dual Filter** - Brand → Category sequence with smart hide
- 📊 **Order History** - All WhatsApp orders saved to admin dashboard
- 🎨 **Heart Wishlist** - Customers can mark favorites

### Pricing Logic
- **Single + Carton enabled**: Single = flat price, Carton = slab pricing (1-4 / 5-9 / 10+)
- **Single only**: Slab pricing on pieces (1-4 / 5-9 / 10+)
- **Carton only**: Slab pricing on cartons
- **Mixed cart**: Customer can buy both single + carton of same product

## 📁 Files Included

```
SRK_Enterprises_Portal/
├── index.html              Retailer portal (with carousel, mobile fixes)
├── admin.html              Admin panel (sidebar layout)
├── style.css               Portal stylesheet
├── app.js                  Portal logic (carousel, filters, cart)
├── products.js             36 products + brands + banners catalogue
├── logo-circle.png         Round logo (favicon + header)
├── banner-1.jpg            SRK Enterprises brand banner (slide 1)
├── banner-2.jpg            Independence products photo (slide 2)
└── README.md               This file
```

## 🚀 Quick Start

1. Extract the folder
2. Double-click `index.html` for retailer portal
3. Double-click `admin.html` for admin panel
4. **Admin password:** `srk@admin2026` (change after first login)

## 🎨 Color Palette (Matching Logo)

| Color | Hex | Usage |
|---|---|---|
| Navy Blue | `#1E3A8A` | Header text, primary buttons, prices |
| Deep Navy | `#0F1F5C` | Sidebar background, gradients |
| Vibrant Orange | `#F97316` | "My Cart" button, discount badges, secondary |
| Fresh Green | `#16A34A` | In-stock badges, success, accent |
| Cream | `#FFF7ED` | Price slab background |
| Background | `#F8FAFC` | Clean light background |
| WhatsApp Green | `#25D366` | WhatsApp/checkout buttons |

## 📦 Product Data Structure (v5.0)

```js
{
  id: 'oil-001',
  category: 'Edible Oil',
  brand: 'Reliance Independence',
  name: 'Reliance Independence Sunflower Oil',
  nameTelugu: 'రిలయన్స్ ఇండిపెండెన్స్ సన్‌ఫ్లవర్ ఆయిల్',
  packSize: '1L Pouch',
  image: '',
  emoji: '🌻',
  
  // Sale options
  allowSingle: true,
  allowCarton: true,
  defaultUnit: 'carton',  // 'single' | 'carton'
  
  // Single pricing
  singleMrp: 175,
  singlePrice: 150,              // Flat when both enabled
  singlePrice_1_4: 150,          // Slabs when only single
  singlePrice_5_9: 145,
  singlePrice_10_plus: 140,
  
  // Carton pricing
  cartonType: 'Carton',          // 'Carton' | 'Bag' | 'Box' | 'Case'
  unitsPerCarton: 12,
  cartonMrp: 2100,
  cartonPrice_1_4: 1680,
  cartonPrice_5_9: 1620,
  cartonPrice_10_plus: 1560,
  
  description: 'Carton contains 12 x 1L bottles',
  stockStatus: 'in'
}
```

## 🏷️ Brand Management

Default brands:
- **Reliance Independence** (30 products: Edible Oil, Atta, Salt, Rice, Ghee)
- **Surya Masale** (6 products: Spices)

### Via Admin Panel:
1. Login → Click "Brands" in sidebar
2. Add Brand: Enter name, Telugu name, logo URL, mark featured
3. Edit: Click pencil icon
4. Delete: Click trash (only if no products use this brand)

## 🖼️ Banner Management

Max 3 banners. Each banner has:
- Title + Subtitle (optional)
- Image URL or base64 upload (max 500KB)
- Background gradient (fallback)
- Button text
- Active toggle
- Display order (1-3)
- Use overlay toggle (show text on image)

### Default Banners:
1. **Slide 1**: SRK Enterprises brand banner (no overlay - image speaks for itself)
2. **Slide 2**: Reliance Independence products with overlay text

## 🌐 Telugu Language

All 36 default products have Telugu names auto-translated. To add Telugu to a custom product:
1. Admin Panel → Products → Add/Edit
2. Fill "Product Name (Telugu)" field
3. Save

Categories in Telugu (auto-applied):
- Edible Oil → నూనెలు
- Atta → పిండి
- Salt → ఉప్పు
- Rice → బియ్యం
- Ghee → నెయ్యి
- Spices → మసాలాలు

## 💬 WhatsApp Order Format (v5.0)

```
*SRK ENTERPRISES ORDER*
━━━━━━━━━━━━━━━━━━━━━━

*Retailer:* ABC Stores
*Mobile:* 9876543210

━━━━━━━━━━━━━━━━━━━━━━

1. *Reliance Independence Sunflower Oil*
   రిలయన్స్ ఇండిపెండెన్స్ సన్‌ఫ్లవర్ ఆయిల్
   Order: 5 Cartons (60 units)
   Rate: ₹1,620/carton
   Amount: ₹8,100

2. *Surya Masale Turmeric Powder*
   సూర్య మసాలే పసుపు పొడి
   Order: 10 pcs (single)
   Rate: ₹170/pc
   Amount: ₹1,700

━━━━━━━━━━━━━━━━━━━━━━
*Cartons/Bags:* 5
*Single Pieces:* 10
*Total Items:* 15
*GRAND TOTAL: ₹9,800*
━━━━━━━━━━━━━━━━━━━━━━
```

## 🛠️ Admin Panel Tabs

| Tab | Purpose |
|---|---|
| Dashboard | Stats, donut chart by brand, recent orders |
| Products | Add/Edit/Delete with carton+single pricing |
| Brands | Add/Edit/Delete brands with logo + Telugu |
| Banners | Manage up to 3 banner slides |
| Orders | View all WhatsApp orders received |
| Categories | View product distribution by category |
| Import / Export | Download CSV / products.js / reset defaults |
| Settings | Configure WhatsApp number |
| Change Password | Update admin password |

## 🚀 Hosting on GitHub Pages

1. Create GitHub repository (public)
2. Upload all 9 files
3. Settings → Pages → Source: main branch → /(root)
4. Live URL: `https://yourusername.github.io/repo-name/`

## 📱 Tested On

- Chrome / Safari / Firefox / Edge (latest)
- iOS Safari, Android Chrome
- Tablet, Desktop, Mobile (responsive)

## 📞 Contact

- **Phone:** +91 99480 00452
- **WhatsApp:** https://wa.me/919948000452
- **Service Area:** Rajanna Sircilla & Siddipet (FMCG Channel Partner)

---

© SRK Enterprises. All Rights Reserved.


### v5.1 Fixes Applied
- Correct round logo bundled
- Mobile banner centering and overflow fixes
- Mobile cart modal overflow fixes
- Contact section location removed
- Default admin password updated to `Rajanna@0452`
- Default password is no longer shown in the admin UI
