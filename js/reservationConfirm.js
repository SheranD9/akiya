import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const confirmationDiv = document.getElementById("confirmationDetails");
const finalConfirmBtn = document.getElementById("finalConfirmBtn");

// Load saved reservation data
const reservationData = JSON.parse(sessionStorage.getItem("reservationData"));
if (!reservationData) {
  confirmationDiv.innerHTML = "<p>No reservation data found.</p>";
  finalConfirmBtn.style.display = "none";
} else {
  // Format the selected date
  const reservationDateFormatted = new Date(
    Number(reservationData.date)
  ).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  // Show all entered details
  confirmationDiv.innerHTML = `
    <p><strong>Name:</strong> ${reservationData.name}</p>
    <p><strong>Email:</strong> ${reservationData.email}</p>
    <p><strong>Contact:</strong> ${reservationData.contact}</p>
    <p><strong>Date:</strong> ${reservationDateFormatted}</p>
    <p><strong>Payment:</strong> ${reservationData.payment}</p>
    <p><strong>Remarks:</strong> ${reservationData.remarks || "None"}</p>
  `;
}

// Auth check before final submission
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Please login to confirm reservation.");
    finalConfirmBtn.disabled = true;
    return;
  }
  currentUser = user;
});

// Final confirm button: write reservation to Firestore
finalConfirmBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  const reservationToSave = {
    ...reservationData,
    userId: currentUser.uid,
    date: Timestamp.fromMillis(Number(reservationData.date)),
    status: "pending",
    createdAt: serverTimestamp(),
  };

  try {
    const resRef = await addDoc(
      collection(db, "reservations"),
      reservationToSave
    );

    // Show confirmation ticket
    confirmationDiv.innerHTML = `
      <div class="ticket-card">
        <h3>Reservation Confirmed!</h3>
        <p><strong>Reservation ID:</strong> ${resRef.id}</p>
        <p><strong>Name:</strong> ${reservationData.name}</p>
        <p><strong>Email:</strong> ${reservationData.email}</p>
        <p><strong>Contact:</strong> ${reservationData.contact}</p>
        <p><strong>Date:</strong> ${new Date(
          Number(reservationData.date)
        ).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        })}</p>
        <p><strong>Payment Method:</strong> ${reservationData.payment}</p>
        <p><strong>Remarks:</strong> ${reservationData.remarks || "None"}</p>
      </div>
    `;

    // Clear sessionStorage
    sessionStorage.removeItem("reservationData");
    finalConfirmBtn.style.display = "none";

    // Redirect back to the first page after 3 seconds
    setTimeout(() => {
      window.location.href = "index.html"; // or "houses.html" depending on your first page
    }, 3000);
  } catch (err) {
    console.error(err);
    alert("Error saving reservation.");
  }
});
