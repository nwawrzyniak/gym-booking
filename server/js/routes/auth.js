const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { FILES } = require('../config/database');
const { readJSON, writeJSON } = require('../utils/file-operations');
const { getClientIP } = require('../utils/ip-helper');
const { sendRegistrationEmail } = require('../services/email-service');

// Home page / Login page
router.get('/', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = await readJSON(FILES.users);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.render('index', { error: 'Ungültige Anmeldedaten.' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.render('index', { error: 'Ungültige Anmeldedaten.' });
  }

  req.session.userId = user.id;
  req.session.displayName = user.displayName;
  res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Register page
router.get('/register', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('register');
});

// Register post
router.post('/register', async (req, res) => {
  const { firstName, lastName, displayName, email, password } = req.body;
  const ip = getClientIP(req);

  const blockedIPs = await readJSON(FILES.blocked);
  if (blockedIPs.includes(ip)) {
    return res.render('register', { error: 'Ihre IP-Adresse wurde blockiert.' });
  }

  const users = await readJSON(FILES.users);
  const pending = await readJSON(FILES.pending);

  if (users.find(u => u.email === email) || pending.find(p => p.email === email)) {
    return res.render('register', { error: 'Diese E-Mail-Adresse ist bereits registriert.' });
  }

  if (users.find(u => u.displayName === displayName) || pending.find(p => p.displayName === displayName)) {
    return res.render('register', { error: 'Dieser Anzeigename ist bereits vergeben.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = Math.random().toString(36).substr(2) + Date.now().toString(36);

  const newUser = {
    id: Date.now(),
    firstName,
    lastName,
    displayName,
    email,
    password: hashedPassword,
    ip,
    token,
    createdAt: new Date().toISOString(),
    humor: false,
    role: 'user'
  };

  pending.push(newUser);
  await writeJSON(FILES.pending, pending);

  try {
    res.render('register', { success: 'Registrierung erfolgreich! Bitte warten Sie auf die Freigabe durch den Administrator.' });

    // Send email asynchronously without awaiting
    sendRegistrationEmail(newUser, token).catch(err => {
      console.error('Email error:', err);
    });
  } catch (err) {
    console.error('Render error:', err);
    res.render('register', { error: 'Ein Fehler ist aufgetreten.' });
  }
});

// Approve user
router.get('/admin/approve/:token', async (req, res) => {
  const pending = await readJSON(FILES.pending);
  const userIndex = pending.findIndex(u => u.token === req.params.token);

  if (userIndex === -1) {
    return res.send('Ungültiger Token oder bereits verarbeitet.');
  }

  const user = pending[userIndex];
  const humor = req.query.humor === 'true';
  user.humor = humor;
  user.role = user.role || 'user';
  delete user.token;

  const users = await readJSON(FILES.users);
  users.push(user);
  await writeJSON(FILES.users, users);

  pending.splice(userIndex, 1);
  await writeJSON(FILES.pending, pending);

  res.send('Benutzer wurde erfolgreich freigegeben!');
});

// Reject user
router.get('/admin/reject/:token', async (req, res) => {
  const pending = await readJSON(FILES.pending);
  const userIndex = pending.findIndex(u => u.token === req.params.token);

  if (userIndex === -1) {
    return res.send('Ungültiger Token oder bereits verarbeitet.');
  }

  pending.splice(userIndex, 1);
  await writeJSON(FILES.pending, pending);

  res.send('Registrierung wurde abgelehnt.');
});

// Block IP
router.get('/admin/block/:token', async (req, res) => {
  const pending = await readJSON(FILES.pending);
  const userIndex = pending.findIndex(u => u.token === req.params.token);

  if (userIndex === -1) {
    return res.send('Ungültiger Token oder bereits verarbeitet.');
  }

  const user = pending[userIndex];
  const blockedIPs = await readJSON(FILES.blocked);

  if (!blockedIPs.includes(user.ip)) {
    blockedIPs.push(user.ip);
    await writeJSON(FILES.blocked, blockedIPs);
  }

  pending.splice(userIndex, 1);
  await writeJSON(FILES.pending, pending);

  res.send('IP-Adresse wurde blockiert und Registrierung abgelehnt.');
});

module.exports = router;