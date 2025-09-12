import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const userInfoDiv = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in → redirect
    window.location.href = "login.html";
  } else {
    // Logged in → fetch Firestore user profile
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      userInfoDiv.innerHTML = `
        <p>Welcome, <strong>${data.name}</strong> (${data.email})</p>
      `;
    }
  }
});

// LOGOUT
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error logging out. Check console.");
    }
  });
}
