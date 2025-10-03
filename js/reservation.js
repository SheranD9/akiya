// js/reservation.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const houseDetails = document.getElementById("houseDetails");
const reservationForm = document.getElementById("reservationForm");
const dateInput = document.getElementById("date");
const logoutBtn = document.getElementById("logoutBtn");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const contactInput = document.getElementById("contact");
const paymentInput = document.getElementById("payment");
const remarksInput = document.getElementById("remarks");
const confirmationBox = document.getElementById("confirmationBox");

// Get houseId or museumId from URL
const urlParams = new URLSearchParams(window.location.search);
const houseId = urlParams.get("houseId");
const museumId = urlParams.get("museumId");

let currentUser = null;
let currentHouse = null;

// Helper: prevent past dates
function setMinDateToToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.setAttribute("min", `${yyyy}-${mm}-${dd}`);
}

// Prefill profile info
async function prefillUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.name) nameInput.value = data.name;
      if (data.email) emailInput.value = data.email;
      if (data.phone) contactInput.value = data.phone;
    }
  } catch (err) {
    console.warn("Could not prefill user profile:", err);
  }
}

// Sanitize for HTML
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Load house details
async function loadHouseDetails(houseId) {
  try {
    const houseRef = doc(db, "houses", houseId);
    const houseSnap = await getDoc(houseRef);

    if (!houseSnap.exists()) {
      houseDetails.innerHTML = "<p>House not found.</p>";
      return;
    }

    currentHouse = houseSnap.data();
    displayHouseOrMuseum(currentHouse);
  } catch (err) {
    console.error("Error loading house:", err);
    houseDetails.innerHTML = "<p>Error loading house details.</p>";
  }
}

// Load museum details
async function loadMuseumDetails(museumId) {
  try {
    const museumRef = doc(db, "museums", museumId);
    const museumSnap = await getDoc(museumRef);

    if (!museumSnap.exists()) {
      houseDetails.innerHTML = "<p>Museum not found.</p>";
      return;
    }

    currentHouse = museumSnap.data();
    displayHouseOrMuseum(currentHouse);
  } catch (err) {
    console.error("Error loading museum:", err);
    houseDetails.innerHTML = "<p>Error loading museum details.</p>";
  }
}

// Display details in the form area
function displayHouseOrMuseum(item) {
  houseDetails.innerHTML = `
    <h2>${item.title || "名称未設定"}</h2>
    <p><strong>住所:</strong> ${item.address?.prefecture ?? ""}${
    item.address?.city ?? ""
  }${item.address?.detail ?? ""}</p>
    ${
      item.period
        ? `<p><strong>会期:</strong> ${item.period}</p>`
        : item.priceYen
        ? `<p><strong>価格:</strong> ${item.priceYen}円</p>`
        : ""
    }
    <p><strong>入場料:</strong> ${
      item.priceYen ? item.priceYen + "円" : "未設定"
    }</p>
    ${
      item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.title}" style="max-width:100%;border-radius:8px;margin-top:10px;">`
        : ""
    }
  `;

  // Prefill remarks with item title by default
  if (remarksInput && item.title) {
    remarksInput.value = `Reservation for ${item.title}`;
  }
}

// Auth & init
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  setMinDateToToday();
  emailInput.value = user.email ?? "";
  prefillUserProfile(user.uid);

  // Load item details
  if (houseId) {
    await loadHouseDetails(houseId);
  } else if (museumId) {
    await loadMuseumDetails(museumId);
  } else {
    houseDetails.innerHTML = "<p>No item selected.</p>";
  }
});

// Submit reservation
reservationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const selectedDate = dateInput.value;
  if (!selectedDate) {
    alert("Please select a visit date.");
    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const contact = contactInput.value.trim();
  const payment = paymentInput.value;
  let remarks = remarksInput.value.trim();

  if (!name || !email || !contact) {
    alert("Please fill name, email and contact number.");
    return;
  }

  if (!remarks && currentHouse) {
    remarks = `Reservation for ${currentHouse.title} on ${selectedDate}`;
  }

  const reservationData = {
    houseId: houseId || null,
    museumId: museumId || null,
    userId: currentUser.uid,
    name,
    email,
    contact,
    date: selectedDate,
    payment,
    remarks,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(
      collection(db, "reservations"),
      reservationData
    );

    reservationForm.style.display = "none";
    confirmationBox.innerHTML = `
      <div class="confirmation">
        <h2>Reservation Confirmed 🎉</h2>
        <p><strong>ID:</strong> ${docRef.id}</p>
        <p><strong>Item:</strong> ${escapeHtml(currentHouse?.title || "")}</p>
        <p><strong>Date:</strong> ${selectedDate}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Contact:</strong> ${escapeHtml(contact)}</p>
        <p><strong>Payment:</strong> ${escapeHtml(payment)}</p>
        <p><strong>Remarks:</strong> ${escapeHtml(remarks)}</p>
        <button onclick="window.location.href='museums.html'">Back to Houses</button>
      </div>
    `;
  } catch (err) {
    console.error("Error creating reservation:", err);
    alert("Error submitting reservation. Check console.");
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});
