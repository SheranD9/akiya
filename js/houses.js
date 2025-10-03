import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const houseList = document.getElementById("houseList");
const filterLocation = document.getElementById("filterLocation");
const filterPrice = document.getElementById("filterPrice");
const filterSize = document.getElementById("filterSize");
const filterBtn = document.getElementById("filterBtn");
const logoutBtn = document.getElementById("logoutBtn");

let allHouses = [];

// --------------------
// Auth check
// --------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  loadHouses();
});

// --------------------
// Load houses from Firestore
// --------------------
async function loadHouses() {
  houseList.innerHTML = "<li>Loading houses...</li>";
  try {
    const snapshot = await getDocs(collection(db, "houses"));
    allHouses = [];
    snapshot.forEach((docSnap) => {
      allHouses.push({ id: docSnap.id, ...docSnap.data() });
    });
    displayHouses(allHouses);
  } catch (error) {
    console.error("Error loading houses:", error);
    houseList.innerHTML = "<li>Error loading houses. Check console.</li>";
  }
}

// --------------------
// Display houses
// --------------------
function displayHouses(houses) {
  houseList.innerHTML = "";
  if (!houses.length) {
    houseList.innerHTML = "<li>No houses found.</li>";
    return;
  }
  houses.forEach((house) => {
    const li = document.createElement("li");
    li.className = "house-card";
    li.innerHTML = `
      <h3>${house.title} - ¥${house.price}</h3>
      <p>${house.description}</p>
      <p>Location: ${house.city}, ${house.address}</p>
      <p>Size: ${house.size} m²</p>
      ${
        house.images && house.images.length
          ? `<img src="${house.images[0]}" alt="House Image" width="200"/>`
          : ""
      }
      <button onclick="bookHouse('${house.id}')">Book Visit</button>
    `;
    houseList.appendChild(li);
  });
}

// --------------------
// Filter houses
// --------------------
filterBtn.addEventListener("click", () => {
  let filtered = allHouses;

  if (filterLocation.value) {
    filtered = filtered.filter((h) =>
      h.city.toLowerCase().includes(filterLocation.value.toLowerCase())
    );
  }
  if (filterPrice.value) {
    filtered = filtered.filter((h) => h.price <= Number(filterPrice.value));
  }
  if (filterSize.value) {
    filtered = filtered.filter((h) => h.size >= Number(filterSize.value));
  }

  displayHouses(filtered);
});

// --------------------
// Book house function → redirect to ticket.html
// --------------------
window.bookHouse = function (houseId) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Please login first to book a visit.");
      window.location.href = "login.html";
      return;
    }
    window.location.href = "ticket.html?houseId=" + houseId;
  });
};

// --------------------
// Logout
// --------------------
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    alert("Error logging out.");
  }
});
