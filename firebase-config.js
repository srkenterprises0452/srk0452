// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔴 Replace with YOUR Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDHyxShwGd_sFTp_X-pv44r6jfU64Qaz14",
  authDomain: "srkeprises0452.firebaseapp.com",
  projectId: "srkeprises0452",
  storageBucket: "srkeprises0452.firebasestorage.app",
  messagingSenderId: "60176274646",
  appId: "1:60176274646:web:e9e5614c647c40f3d82577"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// expose globally
window.SRK_FB = {
  db,
  collection,
  getDocs,
  addDoc,
  query,
  where
};
``
