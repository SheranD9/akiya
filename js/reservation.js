import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { db } from "./firebase.js";

const houseList = document.getElementById("houseList");

async function loadHouses() {
  console.log("Fetching houses...");
  const snapshot = await getDocs(collection(db, "houses"));
  console.log("Docs found:", snapshot.size);

  if (snapshot.empty) {
    houseList.innerHTML = "<p>No houses available.</p>";
    return;
  }

  houseList.innerHTML = "";
  snapshot.forEach((doc) => {
    console.log("House:", doc.data()); // 👈 Debug print

    const house = doc.data();
    const div = document.createElement("div");
    div.className = "house-card";
    div.innerHTML = `
      <h3>${house.title || "Untitled"}</h3>
      <p><strong>Location:</strong> ${house.location || "N/A"}</p>
      <p><strong>Price:</strong> ¥${house.price || 0}</p>
      <p><strong>Size:</strong> ${house.size || "Unknown"}</p>
      <img src="${
        house.imageUrl || "https://via.placeholder.com/300"
      }" alt="House image" width="200">
      <button class="reserveBtn" data-id="${doc.id}">Reserve</button>
    `;
    houseList.appendChild(div);
  });

  // Attach event listeners after rendering
  document.querySelectorAll(".reserveBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const houseId = e.target.getAttribute("data-id");
      console.log("Reserve clicked for:", houseId);
      alert("Reservation system coming next! House ID: " + houseId);
    });
  });
}

loadHouses();
