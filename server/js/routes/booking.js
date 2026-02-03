const express = require('express');
const router = express.Router();

const { FILES } = require('../config/database');
const { readJSON, writeJSON } = require('../utils/fileOperations');
const { isAdmin } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

// Book page
router.get('/book', requireAuth, async (req, res) => {
  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === req.session.userId);

  res.render('book', {
    displayName: req.session.displayName,
    humor: user?.humor || false,
    isAdmin: isAdmin(user)
  });
});

// Create booking
router.post('/book', requireAuth, async (req, res) => {
  const { date, startTime, endTime } = req.body;
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === req.session.userId);

  if (end <= start) {
    return res.render('book', {
      displayName: req.session.displayName,
      humor: user?.humor || false,
      isAdmin: isAdmin(user),
      error: 'Die Endzeit muss nach der Startzeit liegen.'
    });
  }

  const bookings = await readJSON(FILES.bookings);

  const conflict = bookings.find(b => {
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return (start < bEnd && end > bStart);
  });

  if (conflict) {
    return res.render('book', {
      displayName: req.session.displayName,
      humor: user?.humor || false,
      isAdmin: isAdmin(user),
      error: 'Der Raum ist zu dieser Zeit bereits reserviert.'
    });
  }

  const newBooking = {
    id: Date.now(),
    userId: req.session.userId,
    displayName: req.session.displayName,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    completed: false
  };

  bookings.push(newBooking);
  await writeJSON(FILES.bookings, bookings);

  res.redirect('/dashboard');
});

// View all bookings
router.get('/bookings', requireAuth, async (req, res) => {
  const bookings = await readJSON(FILES.bookings);
  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === req.session.userId);
  const now = new Date();

  const allBookings = bookings
    .filter(b => new Date(b.endTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  res.render('bookings', {
    displayName: req.session.displayName,
    humor: user?.humor || false,
    isAdmin: isAdmin(user),
    bookings: allBookings
  });
});

// Complete booking
router.post('/complete-booking/:id', requireAuth, async (req, res) => {
  const { duration, distance } = req.body;
  const bookingId = parseInt(req.params.id);

  const bookings = await readJSON(FILES.bookings);
  const booking = bookings.find(b => b.id === bookingId && b.userId === req.session.userId);

  if (!booking) {
    return res.status(404).json({ error: 'Buchung nicht gefunden.' });
  }

  booking.completed = true;
  booking.actualDuration = parseInt(duration);
  booking.distance = parseFloat(distance);
  await writeJSON(FILES.bookings, bookings);

  const sessions = await readJSON(FILES.sessions);
  sessions.push({
    userId: req.session.userId,
    displayName: req.session.displayName,
    duration: parseInt(duration),
    distance: parseFloat(distance),
    date: new Date().toISOString()
  });
  await writeJSON(FILES.sessions, sessions);

  res.json({ success: true });
});

module.exports = router;