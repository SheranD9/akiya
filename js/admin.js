import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const houseForm = document.getElementById("houseForm");
const houseList = document.getElementById("houseList");
const logoutBtn = document.getElementById("logoutBtn");
const reservationList = document.getElementById("reservationList");

let editMode = false;
let currentEditId = null;

// --------------------
// Auth + Admin check
// --------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;

    if (!isAdmin) {
      alert("You are not authorized to access this page.");
      window.location.href = "index.html";
      return;
    }

    console.log("✅ Admin logged in:", user.uid);
    document.body.style.display = "block"; // show the page

    loadHouses();
    loadReservations(); // load reservations only if admin
  } catch (error) {
    console.error("Error checking admin:", error);
    alert("Error checking admin. Please try again later.");
    window.location.href = "index.html";
  }
});

// --------------------
// Reservations (Admin)
// --------------------
async function loadReservations() {
  reservationList.innerHTML = "<p>Loading reservations...</p>";

  try {
    const snapshot = await getDocs(collection(db, "reservations"));

    if (snapshot.empty) {
      reservationList.innerHTML = "<p>No reservations yet.</p>";
      return;
    }

    reservationList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const res = docSnap.data();

      const div = document.createElement("div");
      div.className = "reservation-card";
      div.innerHTML = `
        <p><strong>Reservation ID:</strong> ${docSnap.id}</p>
        <p><strong>House ID:</strong> ${res.houseId || "Unknown"}</p>
        <p><strong>User ID:</strong> ${res.userId || "Unknown"}</p>
        <p><strong>Date:</strong> ${res.date || "Not set"}</p>
        <p><strong>Status:</strong> <span class="status">${res.status || "pending"}</span></p>
        <button class="approveBtn" data-id="${docSnap.id}" ${res.status === "approved" ? "disabled" : ""}>✅ Approve</button>
        <button class="declineBtn" data-id="${docSnap.id}" ${res.status === "declined" ? "disabled" : ""}>❌ Decline</button>
      `;
      reservationList.appendChild(div);
    });

    // Attach event listeners
    document.querySelectorAll(".approveBtn").forEach((btn) => {
      btn.addEventListener("click", () =>
        updateReservationStatus(btn.dataset.id, "approved")
      );
    });
    document.querySelectorAll(".declineBtn").forEach((btn) => {
      btn.addEventListener("click", () =>
        updateReservationStatus(btn.dataset.id, "declined")
      );
    });
  } catch (error) {
    console.error("Error loading reservations:", error);
    reservationList.innerHTML = `<p>Error loading reservations: ${error.message}</p>`;
  }
}

// --------------------
// Update Reservation Status
// --------------------
async function updateReservationStatus(reservationId, status) {
  try {
    const resRef = doc(db, "reservations", reservationId);
    await updateDoc(resRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    alert(`Reservation ${status}!`);
    loadReservations(); // refresh list
  } catch (error) {
    console.error("Error updating reservation:", error);
    alert("Error updating reservation. Check console.");
  }
}

// --------------------
// Load Houses
// --------------------
async function loadHouses() {
  houseList.innerHTML = "<li>Loading houses...</li>";
  try {
    const snapshot = await getDocs(collection(db, "houses"));
    if (snapshot.empty) {
      houseList.innerHTML = "<li>No houses found.</li>";
      return;
    }
    houseList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const house = docSnap.data();
      const li = document.createElement("li");
      li.className = "house-card";
      li.innerHTML = `
        <strong>${house.title || "Untitled"}</strong>
        <br>${house.address || ""}, ${house.city || ""}
        <br>Price: ¥${house.price || "N/A"} | Size: ${house.size || "?"} m²
        <br>
        <button class="editBtn" data-id="${docSnap.id}">Edit</button>
        <button class="deleteBtn" data-id="${docSnap.id}">Delete</button>
      `;
      houseList.appendChild(li);
    });
    // Attach event listeners
    document.querySelectorAll(".editBtn").forEach((btn) => {
      btn.addEventListener("click", () => editHouse(btn.dataset.id));
    });
    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", () => deleteHouse(btn.dataset.id));
    });
  } catch (error) {
    console.error("Error loading houses:", error);
    houseList.innerHTML = `<li>Error loading houses: ${error.message}</li>`;
  }
}

// --------------------
// Edit House
// --------------------
async function editHouse(houseId) {
  try {
    const houseRef = doc(db, "houses", houseId);
    const houseSnap = await getDoc(houseRef);
    if (!houseSnap.exists()) {
      alert("House not found.");
      return;
    }
    const house = houseSnap.data();
    houseForm.title.value = house.title || "";
    houseForm.description.value = house.description || "";
    houseForm.address.value = house.address || "";
    houseForm.city.value = house.city || "";
    houseForm.lat.value = house.lat || "";
    houseForm.lng.value = house.lng || "";
    houseForm.price.value = house.price || "";
    houseForm.size.value = house.size || "";
    houseForm.images.value = (house.images || []).join(", ");
    editMode = true;
    currentEditId = houseId;
    houseForm.querySelector("button[type=submit]").textContent = "Update House";
  } catch (error) {
    console.error("Error editing house:", error);
    alert("Error loading house for editing.");
  }
}

// --------------------
// Delete House
// --------------------
async function deleteHouse(houseId) {
  if (!confirm("Are you sure you want to delete this house?")) return;
  try {
    await deleteDoc(doc(db, "houses", houseId));
    loadHouses();
    alert("House deleted.");
  } catch (error) {
    console.error("Error deleting house:", error);
    alert("Error deleting house. Check console.");
  }
}

// --------------------
// Add / Update House
// --------------------
houseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const houseData = {
    title: houseForm.title.value.trim(),
    description: houseForm.description.value.trim(),
    address: houseForm.address.value.trim(),
    city: houseForm.city.value.trim(),
    lat: houseForm.lat.value ? Number(houseForm.lat.value) : null,
    lng: houseForm.lng.value ? Number(houseForm.lng.value) : null,
    price: houseForm.price.value ? Number(houseForm.price.value) : null,
    size: houseForm.size.value ? Number(houseForm.size.value) : null,
    images: houseForm.images.value
      ? houseForm.images.value.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    updatedAt: serverTimestamp(),
  };
  if (!houseData.title || !houseData.description || !houseData.address || !houseData.city || !houseData.price || !houseData.size) {
    alert("Please fill in all required fields.");
    return;
  }
  try {
    if (editMode && currentEditId) {
      const houseRef = doc(db, "houses", currentEditId);
      await updateDoc(houseRef, houseData);
      alert("House updated!");
    } else {
      houseData.createdAt = serverTimestamp();
      await addDoc(collection(db, "houses"), houseData);
      alert("House added!");
    }
    houseForm.reset();
    houseForm.querySelector("button[type=submit]").textContent = "Save House";
    editMode = false;
    currentEditId = null;
    loadHouses();
  } catch (error) {
    console.error("Error saving house:", error);
    alert("Error saving house. Check console.");
  }
});

// --------------------
// Logout
// --------------------
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    alert("Error logging out. Try again.");
  }
});
