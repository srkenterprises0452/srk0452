# ✅ **SRK Enterprises – B2B FMCG Ordering Portal**

A **mobile-first B2B FMCG ordering platform** designed for retailers and field sales teams.

Supports:

* ✅ Retailer self-ordering (public access)
* ✅ Salesman-assisted ordering (route-based)
* ✅ Google Sheet–based shop master
* ✅ WhatsApp order workflow

***

# 🚀 **Live Usage**

## 🟦 Retailer Mode (Default)

```
index.html
```

Features:

* Browse products
* Apply filters (Brand / Category)
* Search products
* Add to cart
* Checkout
* Order via WhatsApp

***

## 🟩 Salesman Mode

```
index.html?mode=salesman
```

Additional capabilities:

* Select:
  * District
  * Mandal
  * Village
* Load shops from Google Sheet
* Add new shop
* Sync shops across devices
* Auto-fill retailer details
* Checkout with location context

***

# 🧩 **Core Architecture**

### ✅ Single Page Application

```
index.html → handles both modes
```

### ✅ Separation of Concerns

| File                               | Responsibility          |
| ---------------------------------- | ----------------------- |
| `index.html`                       | UI layout               |
| `app.js`                           | Business logic          |
| `products.js`                      | Product catalog         |
| `locations.js`                     | Location master         |
| `location-dropdown-integration.js` | Location dropdown logic |
| `style.css`                        | Styles                  |

***

# 🔗 **Shop Master System (Google Sheet)**

## ✅ Source of Truth

Google Sheet stores all shops.

***

## ✅ API (Apps Script)

### Get Shops

```
?action=getShops
```

### Add Shop

```
?action=addShop
```

***

## ✅ Shop Structure

| Field         | Description   |
| ------------- | ------------- |
| shopId        | Unique ID     |
| shopName      | Shop name     |
| contactPerson | Owner/contact |
| mobile        | Phone number  |
| district      | District      |
| mandal        | Mandal        |
| village       | Village       |
| createdAt     | Timestamp     |

***

## ✅ Duplicate Rule

A shop is considered duplicate if:

```
shopName + district + mandal + village match
```

Handled in:

* ✅ Frontend (`app.js`)
* ✅ Backend (Apps Script)

***

# 🔁 **Shop Loading Flow (Final Architecture)**

### Event-Based Architecture

```
Location selected
    ↓
location-dropdown-integration.js
    ↓
Dispatch event → srkLocationChanged
    ↓
app.js listens
    ↓
Load shops from Google Sheet
    ↓
Filter → populate dropdown
```

***

# 📦 **Product System**

Features:

* Brand + Category filters
* Telugu + English product names
* Image fallback (emoji)
* Mobile-optimized layout

***

## 💰 Pricing Model

Supports:

* ✅ Single (pcs)
* ✅ Carton

### Tier Pricing:

```
1–4 units
5–9 units
10+ units
```

***

# 🛒 **Cart System**

* Add/remove items
* Quantity control
* Unit-based cart
* Dynamic pricing
* Savings calculation

***

# 📋 **Checkout System**

## Fields:

* Shop Name
* Contact Person
* Mobile
* Area
* Town
* Remarks

***

## ✅ Salesman Mode Enhancements

Auto-filled from selected shop:

* Shop name
* Contact person
* Mobile
* Area (Village)
* Town (District)

***

# 📲 **WhatsApp Order Flow**

### Final Output:

* Opens WhatsApp with prefilled order
* Includes:

```
Shop details
Product list
Quantity
Pricing
Totals
```

***

## ✅ Salesman Context Added

```
Village
Mandal
District
Selected shop
```

***

# 💾 **Data Storage**

| Data        | Storage      |
| ----------- | ------------ |
| Cart        | localStorage |
| Wishlist    | localStorage |
| Shop cache  | localStorage |
| Orders      | localStorage |
| Shop master | Google Sheet |

***

# ⚙️ **Configuration**

Update in `app.js`:

```javascript
SHOP_SHEET_API_URL: "YOUR_APPS_SCRIPT_EXEC_URL"
```

***

# 🧹 **Project Structure**

```
/root
├── index.html
├── app.js
├── products.js
├── locations.js
├── location-dropdown-integration.js
├── style.css
├── logo-circle.png
├── banner-1.jpg
├── banner-2.jpg
└── README.md
```

***

# ✅ **Pre-Deployment Checklist**

* [ ] Remove old files (`salesman.html`, `salesman.js`, `salesman.css`)
* [ ] Ensure only one `app.js`
* [ ] Apps Script deployed (`/exec`)
* [ ] Hard refresh browser (`Ctrl + Shift + R`)
* [ ] Test both modes

***

# ✅ **End-to-End Test**

### Retail Mode

```
Browse → Add → Checkout → WhatsApp ✅
```

***

### Salesman Mode

```
Select location
→ Load shops ✅
→ Select or add shop ✅
→ Add products ✅
→ Checkout ✅
→ WhatsApp ✅
```

***

# 📌 **Version**

```
v1.0 – Stable Dual Mode Architecture
```

Includes:

* ✅ Event-driven shop loading
* ✅ Google Sheet integration
* ✅ Duplicate-safe shop addition
* ✅ Clean single-page design

***

# 👨‍💻 **Author**

SRK Enterprises  
FMCG Distribution – Telangana (Siddipet & Rajanna Sircilla)

***

# ✅ ✅ FINAL NOTE

This version is:

✔ Stable  
✔ Scalable  
✔ Clean architecture  
✔ Ready for field usage

***
