const express = require('express');
const router = express.Router();

const { FILES } = require('../config/database');
const { readJSON } = require('../utils/file-operations');
const { isAdmin } = require('../utils/helpers');
const { requireAuth } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  const bookings = await readJSON(FILES.bookings);
  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === req.session.userId);
  const now = new Date();

  const userBookings = bookings
    .filter(b => b.userId === req.session.userId)
    .filter(b => new Date(b.endTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  res.render('dashboard', {
    displayName: req.session.displayName,
    humor: user?.humor || false,
    isAdmin: isAdmin(user),
    bookings: userBookings
  });
});

// Leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
  const sessions = await readJSON(FILES.sessions);
  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === req.session.userId);

  const stats = {};
  sessions.forEach(s => {
    if (!stats[s.displayName]) {
      stats[s.displayName] = { displayName: s.displayName, totalDistance: 0, totalDuration: 0 };
    }
    stats[s.displayName].totalDistance += s.distance;
    stats[s.displayName].totalDuration += s.duration;
  });

  const leaderboard = Object.values(stats).sort((a, b) => b.totalDistance - a.totalDistance);

  res.render('leaderboard', {
    displayName: req.session.displayName,
    humor: user?.humor || false,
    isAdmin: isAdmin(user),
    leaderboard
  });
});

module.exports = router;