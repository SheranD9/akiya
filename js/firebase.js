// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8WauCKutQwzK2kkBPprzwWoy7p9cAXVE",
  authDomain: "akiya-app-e7a9b.firebaseapp.com",
  projectId: "akiya-app-e7a9b",
  storageBucket: "akiya-app-e7a9b.firebasestorage.app",
  messagingSenderId: "665091929996",
  appId: "1:665091929996:web:720cedd79b1ba1e4c748a9",
  measurementId: "G-JV28SYR2NL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
