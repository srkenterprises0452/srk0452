// Firebase Config v1.0 (SRK Enterprises)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHyxShwGd_sFTp_X-pv44r6jfU64Qaz14",
  authDomain: "srkeprises0452.firebaseapp.com",
  projectId: "srkeprises0452",
  storageBucket: "srkeprises0452.firebasestorage.app",
  messagingSenderId: "60176274646",
  appId: "1:60176274646:web:e9e5614c647c40f3d82577"
};

// Validate config
if (!firebaseConfig.projectId) {
  console.error("Firebase config missing projectId");
}

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Safe global exposure
window.SRK_FB = window.SRK_FB || {};

window.SRK_FB.db = db;
window.SRK_FB.collection = collection;
window.SRK_FB.getDocs = getDocs;
window.SRK_FB.addDoc = addDoc;
window.SRK_FB.query = query;
window.SRK_FB.where = where;
