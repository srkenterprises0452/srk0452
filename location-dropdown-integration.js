/* SRK Location Dropdown Integration
   Script order in HTML:
   <script src="locations.js"></script>
   <script src="location-dropdown-integration.js"></script>

   Required HTML ids:
   district, mandal, village

   Optional HTML ids for shop filtering:
   shopList, shop
*/

const locations = window.SRK_LOCATION_MASTER || {};

function srkEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function srkOption(value, label) {
  return `<option value="${srkEscapeHtml(value)}">${srkEscapeHtml(label || value)}</option>`;
}

function loadDistricts() {
  const districtEl = document.getElementById("district");
  const mandalEl = document.getElementById("mandal");
  const villageEl = document.getElementById("village");
  if (!districtEl || !mandalEl || !villageEl) return;

  districtEl.innerHTML = srkOption("", "Select District") +
    Object.keys(locations).sort().map(d => srkOption(d)).join("");
  mandalEl.innerHTML = srkOption("", "Select Mandal");
  villageEl.innerHTML = srkOption("", "Select Village");
}

function loadMandals() {
  const d = document.getElementById("district").value;
  const mandalEl = document.getElementById("mandal");
  const villageEl = document.getElementById("village");

  mandalEl.innerHTML = srkOption("", "Select Mandal");
  villageEl.innerHTML = srkOption("", "Select Village");

  if (!d || !locations[d]) return;
  mandalEl.innerHTML += Object.keys(locations[d]).sort().map(m => srkOption(m)).join("");

  if (typeof loadShops === "function") loadShops();
}

function loadVillages() {
  const d = document.getElementById("district").value;
  const m = document.getElementById("mandal").value;
  const villageEl = document.getElementById("village");

  villageEl.innerHTML = srkOption("", "Select Village");

  if (!d || !m || !locations[d] || !locations[d][m]) return;
  villageEl.innerHTML += locations[d][m].map(v => srkOption(v)).join("");

  if (typeof loadShops === "function") loadShops();
}

document.addEventListener("DOMContentLoaded", () => {
  loadDistricts();
  const districtEl = document.getElementById("district");
  const mandalEl = document.getElementById("mandal");
  const villageEl = document.getElementById("village");

  if (districtEl) districtEl.addEventListener("change", loadMandals);
  if (mandalEl) mandalEl.addEventListener("change", loadVillages);
  if (villageEl && typeof loadShops === "function") villageEl.addEventListener("change", loadShops);
});
