const path = require('path');
const fs = require('fs').promises;

const DATA_DIR = path.join(__dirname, '..', 'data');

// File paths
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  bookings: path.join(DATA_DIR, 'bookings.json'),
  sessions: path.join(DATA_DIR, 'training_sessions.json'),
  blocked: path.join(DATA_DIR, 'blocked_ips.json'),
  pending: path.join(DATA_DIR, 'pending_users.json')
};

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
};

module.exports = {
  DATA_DIR,
  FILES,
  ensureDataDir
};