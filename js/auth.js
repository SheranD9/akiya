import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  setDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// --------------------
// Redirect logged-in users based on role
// --------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const isAdmin = userDoc.exists() && userDoc.data().isAdmin;

      if (isAdmin) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      window.location.href = "index.html"; // fallback
    }
  }
});

// --------------------
// SIGNUP
// --------------------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const adminCode = document.getElementById("adminCode").value;

    const SECRET_ADMIN_CODE = "ADMIN123"; // set your secret code

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        isAdmin: adminCode === SECRET_ADMIN_CODE,
        createdAt: serverTimestamp(),
      });

      alert("Signup successful!");
      // Redirect handled automatically by onAuthStateChanged
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

// --------------------
// LOGIN
// --------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("login__password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect handled automatically by onAuthStateChanged
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}
