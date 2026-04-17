function initApp(){
  loadListings();
  loadProfile();
  loadBookings();
  loadHistory();
  fakeNotification();
}

function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.add("hidden");
  });

  document.getElementById(tabId).classList.remove("hidden");

  // 👇 IMPORTANT: reload listings when coming back
  if (tabId === "listings") {
    loadListings();
  }
}

function loadListings(){
  const listings = document.getElementById("listings");
  const cityFilter = document.getElementById("cityFilter");
  const priceFilter = document.getElementById("priceFilter");

  fetch("/listings")
  .then(res => res.json())
  .then(data => {
    const city = cityFilter.value.toLowerCase();
    const price = priceFilter.value;
    listings.innerHTML = "";
    data.forEach(listing => {
      if(city && !listing.title.toLowerCase().includes(city)) return;
      if(price && parseInt(listing.price) > parseInt(price)) return;

      listings.innerHTML += `
        <div class="card">
          <img src="images/room${(listing.id % 12) + 1}.jpg" alt="${listing.title}" class="room-img">
          <h3>${listing.title} <span class="badge"></span></h3>
          <p>${listing.price}</p>
          <p>⭐ ${(Math.random()*2+3).toFixed(1)} (${Math.floor(Math.random()*50)+1} avis)</p>
          <input type="date" id="date-${listing.id}">
          <button onclick="book(${listing.id})">Réserver</button>
        </div>
      `;
    });
  });
}

function loadBookings(){
  const bookingList = document.getElementById("bookingList");
  const bookings = JSON.parse(localStorage.getItem("myBookings")) || [];

  bookingList.innerHTML = "";

  bookings.forEach(b => {

    const now = new Date();
    const bookingDate = new Date(b.date);
    const diffDays = Math.floor((bookingDate - now) / (1000*60*60*24));

    let color = "green";
    let timerText = "";

    // =========================
    // ✅ IF PAID → STOP TIMER COMPLETELY
    // =========================
    if (b.paid) {
      timerText = "💰 Payé - timer arrêté";
      color = "green";
    } else {

      const deadline = new Date(b.deadline);
      const timeLeft = deadline - now;

      if (timeLeft <= 0) {
        timerText = "❌ Expiré";
        color = "red";
      } else {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        timerText = `${hours}h ${mins}m`;
      }

      // urgency colors ONLY if not paid
      if (diffDays >= 30) {
        color = "green";
      } else if (diffDays >= 3 && diffDays <= 8) {
        color = "orange";
      } else if (diffDays < 2) {
        color = "red";
      }
    }

    bookingList.innerHTML += `
      <div class="booking-card">
        <div>
          <h4>${b.title}</h4>
          <p>${b.price} MAD</p>
          <p>📅 ${new Date(b.date).toLocaleDateString()}</p>

          <p style="color:${color}">
            ⏳ Paiement: ${timerText}
          </p>

          <p>Status: ${b.paid ? "✅ Payé" : "⏳ En attente"}</p>
        </div>

        <div>
          ${
            !b.paid 
            ? `<button onclick="pay(${b.booking_id})">Payer</button>`
            : ""
          }
          <button onclick="cancelBooking(${b.booking_id})">Annuler</button>
        </div>
      </div>
    `;
  });
}

function getWallet(){
  return Number(localStorage.getItem("wallet")) || 30000;
}

function setWallet(value){
  localStorage.setItem("wallet", Number(value));
}

function addTransaction(type, amount, title){
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  transactions.push({
    type, // "payment" | "refund"
    amount,
    title,
    date: new Date()
  });

  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function book(id){
  const user = JSON.parse(localStorage.getItem("user"));
  const dateInput = document.getElementById(`date-${id}`).value;

  if(!dateInput){
    alert("⚠️ Choisissez une date !");
    return;
  }

  const bookingDate = new Date(dateInput);
  const today = new Date();
  const diffDays = Math.floor((bookingDate - today) / (1000*60*60*24));

  const card = document.querySelector(`.card button[onclick="book(${id})"]`).parentElement;
  const title = card.querySelector("h3").innerText;
  const price = parseInt(card.querySelector("p").innerText);

  let bookings = JSON.parse(localStorage.getItem("myBookings")) || [];

  if (bookings.find(b => b.listing_id === id)) {
    alert("⚠️ Déjà réservé !");
    return;
  }

  if(bookingDate < new Date()){
    alert("❌ Date invalide !");
    return;
  }

  let deadline;

  if(diffDays >= 30){
    deadline = new Date(today.getTime() + 28*24*60*60*1000);
  } else if(diffDays >= 3 && diffDays <= 8){
    deadline = new Date(today.getTime() + 3*24*60*60*1000);
  } else if(diffDays < 2){
    deadline = new Date(today.getTime() + 60*60*1000); // 1h
  } else {
    deadline = new Date(today.getTime() + 24*60*60*1000);
  }

  const newBooking = {
    booking_id: Date.now(),
    listing_id: id,
    title,
    price,
    paid: false,
    date: bookingDate,
    deadline: deadline
  };

  bookings.push(newBooking);
  localStorage.setItem("myBookings", JSON.stringify(bookings));

  alert("✅ Réservé !");
  loadBookings();
}

function pay(booking_id){
  let bookings = JSON.parse(localStorage.getItem("myBookings")) || [];
  let wallet = getWallet();

  const booking = bookings.find(b => b.booking_id === booking_id);

  if(wallet < booking.price){
    alert("❌ Fonds insuffisants !");
    return;
  }

  wallet -= booking.price;
  booking.paid = true;

  setWallet(wallet);

  addTransaction("payment", -booking.price, booking.title);

  localStorage.setItem("myBookings", JSON.stringify(bookings));

  alert("💳 Paiement réussi !");
  loadBookings();
  loadProfile();
}

function sendMessage(){
  const msg = msgInput.value.trim().toLowerCase();
  if(!msg) return;

  chatBox.innerHTML += `<p><b>Vous:</b> ${msg}</p>`;
  msgInput.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  let reply = "";

  // =========================
  // SMART RESPONSES
  // =========================

  if(msg.includes("disponible") || msg.includes("available")) {
    reply = "Oui 😊 l'appartement est encore disponible pour les dates demandées.";
  }
  else if(msg.includes("prix") || msg.includes("price")) {
    reply = "Le prix dépend des dates, mais il commence à partir de 300 MAD/nuit.";
  }
  else if(msg.includes("visite") || msg.includes("visit")) {
    reply = "Bien sûr 👍 vous pouvez programmer une visite quand vous voulez.";
  }
  else if(msg.includes("wifi")) {
    reply = "Oui, l'appartement dispose d'un WiFi haut débit gratuit.";
  }
  else if(msg.includes("merci")) {
    reply = "Avec plaisir 😊 si vous avez d'autres questions je suis là.";
  }
  else if(msg.includes("bonjour") || msg.includes("salut")) {
    reply = "Bonjour 👋 comment puis-je vous aider ?";
  }
  else {
    reply = "Je ne suis pas sûr de comprendre 🤔 pouvez-vous reformuler ?";
  }

  setTimeout(() => {
    chatBox.innerHTML += `<p><b>Propriétaire:</b> ${reply}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 800);
}

function scrollListings(direction){
  const container = document.getElementById("listings");
  const scrollAmount = 300;

  container.scrollBy({
    left: direction * scrollAmount,
    behavior: "smooth"
  });
}

function loadProfile(){
  const user = JSON.parse(localStorage.getItem("user"));
  const wallet = Number(localStorage.getItem("wallet")) || 30000;

  const bookings = JSON.parse(localStorage.getItem("myBookings")) || [];
  const favs = JSON.parse(localStorage.getItem("favorites")) || [];

  const total = bookings.length;
  const paid = bookings.filter(b => b.paid).length;
  const pending = total - paid;

  const color = wallet < 1000 ? "red" : "green";

  // Header
  document.getElementById("profileHeader").innerHTML = `
    <h2>Bienvenue, ${user.username} 👋</h2>
    <p>Compte étudiant COLOC UP</p>
  `;

  // Stats
  document.getElementById("totalBookings").innerText = total;
  document.getElementById("paidBookings").innerText = paid;
  document.getElementById("pendingBookings").innerText = pending;
  document.getElementById("favCount").innerText = favs.length;

  // Wallet
  document.getElementById("walletDisplay").innerHTML = `
    💰 Wallet: <span style="color:${color}">${wallet} MAD</span>
  `;
}

function loadHistory(){
  const historyList = document.getElementById("historyList");
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  historyList.innerHTML = "";

  transactions.reverse().forEach(t => {
    const color = t.amount < 0 ? "red" : "green";

    historyList.innerHTML += `
      <div class="booking-card">
        <p style="color:${color}">
          ${t.amount > 0 ? "💰" : "💸"} ${t.amount} MAD
        </p>
        <p>${t.title}</p>
        <p>${new Date(t.date).toLocaleString()}</p>
      </div>
    `;
  });
}

function cancelBooking(booking_id){
  let bookings = JSON.parse(localStorage.getItem("myBookings")) || [];
  let wallet = Number(localStorage.getItem("wallet"));

  const booking = bookings.find(b => b.booking_id === booking_id);

  if(booking.paid){
    wallet += booking.price; // refund
    addTransaction("refund", booking.price, booking.title);
  }

  bookings = bookings.filter(b => b.booking_id !== booking_id);

  localStorage.setItem("wallet", wallet);
  localStorage.setItem("myBookings", JSON.stringify(bookings));

  alert("❌ Réservation annulée !");
  loadBookings();
  loadProfile();
}

function fakeNotification(){
  setTimeout(() => {
    alert("🔔 Rappel: Vous avez un paiement à effectuer prochainement !");
  }, 10000);
}

function logout(){
  localStorage.removeItem("user");
  window.location = "login.html";
}