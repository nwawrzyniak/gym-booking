const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
};

// File paths
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  bookings: path.join(DATA_DIR, 'bookings.json'),
  sessions: path.join(DATA_DIR, 'training_sessions.json'),
  blocked: path.join(DATA_DIR, 'blocked_ips.json'),
  pending: path.join(DATA_DIR, 'pending_users.json')
};

// Helper functions for file operations
const readJSON = async (filePath, defaultValue = []) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeJSON(filePath, defaultValue);
      return defaultValue;
    }
    throw err;
  }
};

const writeJSON = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('trust proxy', true);

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  next();
};

// Get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress;
};

// Routes
app.get('/', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

app.get('/register', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('register');
});

app.post('/register', async (req, res) => {
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

  const approveUrlHumor = `${process.env.BASE_URL}/admin/approve/${token}?humor=true`;
  const approveUrlNoHumor = `${process.env.BASE_URL}/admin/approve/${token}?humor=false`;
  const rejectUrl = `${process.env.BASE_URL}/admin/reject/${token}`;
  const blockUrl = `${process.env.BASE_URL}/admin/block/${token}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'Neue Registrierung - Gym Booking System',
    html: `
      <h2>Neue Registrierungsanfrage</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Anzeigename:</strong> ${displayName}</p>
      <p><strong>E-Mail:</strong> ${email}</p>
      <p><strong>IP-Adresse:</strong> ${ip}</p>
      <p><strong>Datum:</strong> ${new Date().toLocaleString('de-DE')}</p>
      <br>
      <p>
        <a href="${approveUrlHumor}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">Approve (Humor)</a>
        <a href="${approveUrlNoHumor}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">Approve (No Humor)</a>
        <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">Ablehnen</a>
        <a href="${blockUrl}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none;">IP-Adresse blockieren</a>
      </p>
    `
  };

  try {
    res.render('register', { success: 'Registrierung erfolgreich! Bitte warten Sie auf die Freigabe durch den Administrator.' });
    
    // Send email asynchronously without awaiting
    transporter.sendMail(mailOptions).catch(err => {
      console.error('Email error:', err);
    });
  } catch (err) {
    console.error('Render error:', err);
    res.render('register', { error: 'Ein Fehler ist aufgetreten.' });
  }
});

app.get('/admin/approve/:token', async (req, res) => {
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

app.get('/admin/reject/:token', async (req, res) => {
  const pending = await readJSON(FILES.pending);
  const userIndex = pending.findIndex(u => u.token === req.params.token);

  if (userIndex === -1) {
    return res.send('Ungültiger Token oder bereits verarbeitet.');
  }

  pending.splice(userIndex, 1);
  await writeJSON(FILES.pending, pending);

  res.send('Registrierung wurde abgelehnt.');
});

app.get('/admin/block/:token', async (req, res) => {
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

app.get('/login', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login');
});

app.post('/login', async (req, res) => {
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

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/dashboard', requireAuth, async (req, res) => {
  const bookings = await readJSON(FILES.bookings);
  const now = new Date();
  
  const upcomingBookings = bookings
    .filter(b => b.userId === req.session.userId && new Date(b.endTime) > now)
    .map(b => ({
      ...b,
      canComplete: !b.completed && new Date(b.startTime) <= now
    }))
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  res.render('dashboard', { 
    displayName: req.session.displayName,
    upcomingBookings
  });
});

app.get('/book', requireAuth, async (req, res) => {
  res.render('book', { displayName: req.session.displayName });
});

app.post('/book', requireAuth, async (req, res) => {
  const { date, startTime, endTime } = req.body;
  
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);
  
  if (end <= start) {
    return res.render('book', { 
      displayName: req.session.displayName,
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

app.get('/bookings', requireAuth, async (req, res) => {
  const bookings = await readJSON(FILES.bookings);
  const now = new Date();
  
  const allBookings = bookings
    .filter(b => new Date(b.endTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  res.render('bookings', { 
    displayName: req.session.displayName,
    bookings: allBookings
  });
});

app.post('/complete-booking/:id', requireAuth, async (req, res) => {
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

app.get('/leaderboard', requireAuth, async (req, res) => {
  const sessions = await readJSON(FILES.sessions);
  
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
    leaderboard
  });
});

// Start server
ensureDataDir().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
