const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { FILES } = require('../config/database');
const { readJSON, writeJSON } = require('../utils/file-operations');
const { getClientIP } = require('../utils/ip-helper');
const { sendRegistrationEmail } = require('../services/email-service');

// Home page
router.get('/', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

// Login
router.get('/login', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = await readJSON(FILES.users);

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.render('login', { error: 'Ungültige Anmeldedaten.' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.render('login', { error: 'Ungültige Anmeldedaten.' });
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

// Register
router.get('/register', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('register');
});

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

module.exports = router;