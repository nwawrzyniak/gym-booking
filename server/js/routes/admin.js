const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { FILES } = require('../config/database');
const { readJSON, writeJSON } = require('../utils/fileOperations');
const { requireAdmin } = require('../middleware/auth');

// Admin users page
router.get('/admin-users', requireAdmin, async (req, res) => {
  const users = await readJSON(FILES.users);
  const bookings = await readJSON(FILES.bookings);
  const sessions = await readJSON(FILES.sessions);
  const currentUser = users.find(u => u.id === req.session.userId);
  const now = new Date();

  const usersWithStats = users.map(user => {
    const userBookings = bookings.filter(b => b.userId === user.id);
    const upcomingBookings = userBookings.filter(b => new Date(b.endTime) > now);
    const completedTrainings = sessions.filter(s => s.userId === user.id).length;
    const notFinalizedTrainings = userBookings.filter(b => !b.completed && new Date(b.startTime) <= now).length;

    return {
      ...user,
      totalBookings: userBookings.length,
      upcomingBookings: upcomingBookings.length,
      completedTrainings,
      notFinalizedTrainings
    };
  });

  res.render('admin-users', {
    displayName: req.session.displayName,
    users: usersWithStats,
    currentUser,
    isAdmin: true
  });
});

// Update user role
router.post('/api/user/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  const userId = parseInt(req.params.id);

  if (!['user', 'admin', 'super-admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.role = role;
  await writeJSON(FILES.users, users);

  res.json({ success: true, role });
});

// Update user humor setting
router.post('/api/user/:id/humor', requireAdmin, async (req, res) => {
  const { humor } = req.body;
  const userId = parseInt(req.params.id);

  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.humor = humor === true || humor === 'true';
  await writeJSON(FILES.users, users);

  res.json({ success: true, humor: user.humor });
});

// Edit user
router.post('/api/user/:id/edit', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  const { firstName, lastName, displayName, email, password, humor, role } = req.body;

  // Validate role
  if (!['user', 'admin', 'super-admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if email is already taken by another user
  if (email !== user.email) {
    const emailExists = users.find(u => u.email === email && u.id !== userId);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }
  }

  // Check if displayName is already taken by another user
  if (displayName !== user.displayName) {
    const displayNameExists = users.find(u => u.displayName === displayName && u.id !== userId);
    if (displayNameExists) {
      return res.status(400).json({ error: 'Display name already in use' });
    }
  }

  // Update user information
  user.firstName = firstName;
  user.lastName = lastName;
  user.displayName = displayName;
  user.email = email;
  user.humor = humor === true || humor === 'true';
  user.role = role;

  // Update password if provided
  if (password && password.trim()) {
    user.password = await bcrypt.hash(password, 10);
  }

  await writeJSON(FILES.users, users);

  res.json({ success: true });
});

// Delete user
router.delete('/api/user/:id', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);

  const users = await readJSON(FILES.users);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Delete user from users.json
  users.splice(userIndex, 1);
  await writeJSON(FILES.users, users);

  // Delete all bookings for this user
  const bookings = await readJSON(FILES.bookings);
  const filteredBookings = bookings.filter(b => b.userId !== userId);
  await writeJSON(FILES.bookings, filteredBookings);

  // Delete all training sessions for this user
  const sessions = await readJSON(FILES.sessions);
  const filteredSessions = sessions.filter(s => s.userId !== userId);
  await writeJSON(FILES.sessions, filteredSessions);

  res.json({ success: true });
});

module.exports = router;