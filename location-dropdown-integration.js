/* SRK Location Dropdown Integration
   Requires:
   - locations.js loaded before this file
   - window.SRK_LOCATION_MASTER available
   - HTML ids: district, mandal, village
*/

const locations = window.SRK_LOCATION_MASTER || {};

function srkEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[c]));
}

function srkOption(value, label) {
  return `<option value="${srkEscapeHtml(value)}">${srkEscapeHtml(label || value)}</option>`;
}

function emitLocationChanged() {
  window.dispatchEvent(new CustomEvent("srkLocationChanged", {
    detail: {
      district: document.getElementById("district")?.value || "",
      mandal: document.getElementById("mandal")?.value || "",
      village: document.getElementById("village")?.value || ""
    }
  }));
}

function loadDistricts() {
  const districtEl = document.getElementById("district");
  const mandalEl = document.getElementById("mandal");
  const villageEl = document.getElementById("village");

  if (!districtEl || !mandalEl || !villageEl) return;

  districtEl.innerHTML =
    srkOption("", "Select District") +
    Object.keys(locations).sort().map(d => srkOption(d)).join("");

  mandalEl.innerHTML = srkOption("", "Select Mandal");
  villageEl.innerHTML = srkOption("", "Select Village");

  emitLocationChanged();
}

function loadMandals() {
  const districtEl = document.getElementById("district");
  const mandalEl = document.getElementById("mandal");
  const villageEl = document.getElementById("village");

  if (!districtEl || !mandalEl || !villageEl) return;

  const district = districtEl.value;

  mandalEl.innerHTML = srkOption("", "Select Mandal");
  villageEl.innerHTML = srkOption("", "Select Village");

  if (district && locations[district]) {
    mandalEl.innerHTML += Object.keys(locations[district])
      .sort()
      .map(m => srkOption(m))
      .join("");
  }

  emitLocationChanged();
}

function loadVillages() {
  const districtEl = document.getElementById("district");
  const mandalEl = document.getElementById("mandal");
  const villageEl = document.getElementById("village");

  if (!districtEl || !mandalEl || !villageEl) return;

  const district = districtEl.value;
  const mandal = mandalEl.value;

  villageEl.innerHTML = srkOption("", "Select Village");

  if (district && mandal && locations[district] && locations[district][mandal]) {
    villageEl.innerHTML += locations[district][mandal]
      .map(v => srkOption(v))
      .join("");
  }

  emitLocationChanged();
}

document.addEventListener("DOMContentLoaded", () => {
  loadDistricts();

  const districtEl = document.getElementById("district");
  const mandalEl = document.getElementById("mandal");
  const villageEl = document.getElementById("village");

  if (districtEl) {
    districtEl.addEventListener("change", loadMandals);
  }

  if (mandalEl) {
    mandalEl.addEventListener("change", loadVillages);
  }

  if (villageEl) {
    villageEl.addEventListener("change", emitLocationChanged);
  }
});
