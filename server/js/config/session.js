const session = require('express-session');

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || "super-mega-ultra-secret-session-secret-which-noone-except-me-knows-and-which-is-definitely-not-checked-into-the-repository",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
});

module.exports = sessionConfig;