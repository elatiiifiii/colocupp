const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

// In-memory data storage
const data = {
  users: [],
  listings: [
    { id: 1, title: 'Studio Casablanca', price: '2900 MAD', images: 'images/room1.jpg' },
    { id: 2, title: 'Colocation Kenitra', price: '1800 MAD', images: 'images/room2.jpg' },
    { id: 3, title: 'Appartement Rabat', price: '4800 MAD', images: 'images/room3.jpg' },
    { id: 4, title: 'Appartement Rabat', price: '3300 MAD', images: 'images/room4.jpg' },
    { id: 5, title: 'Chambre Impériale Rabat', price: '5300 MAD', images: 'images/room5.jpg' },
    { id: 6, title: 'Chambre Double Supérieur Rabat', price: '6700 MAD', images: 'images/room6.jpg' },
    { id: 7, title: 'Studio Casablanca CFC', price: '3300 MAD', images: 'images/room7.jpg' },
    { id: 8, title: 'Chambre Tanger luxueuse', price: '3100 MAD', images: 'images/room8.jpg' },
    { id: 9, title: 'Chambre Rabat Hay Riad', price: '8100 MAD', images: 'images/room9.jpg' },
    { id: 10, title: 'Chambre Rabat Agdal', price: '4800 MAD', images: 'images/room10.jpg' },
    { id: 11, title: 'Studio Double CFC', price: '2300 MAD', images: 'images/room11.jpg' },
    { id: 12, title: 'Chambre Villa Rabat', price: '10300 MAD', images: 'images/room12.jpg' }
  ],
  bookings: [],
  nextUserId: 1,
  nextBookingId: 1
};

// AUTH
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const newUser = { id: data.nextUserId++, username, password };
  data.users.push(newUser);
  res.send("User created");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = data.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json(user);
  } else {
    res.status(401).send("Invalid");
  }
});

// DATA
app.get("/listings", (req, res) => {
  res.json(data.listings);
});

app.post("/book", (req, res) => {
  const { user_id, listing_id } = req.body;
  const booking = {
    id: data.nextBookingId++,
    user_id,
    listing_id,
    paid: 0
  };
  data.bookings.push(booking);
  res.json({ booking_id: booking.id });
});

app.post("/pay", (req, res) => {
  const { booking_id } = req.body;
  const booking = data.bookings.find(b => b.id === booking_id);
  if (booking) {
    booking.paid = 1;
  }
  res.send("Paid");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
