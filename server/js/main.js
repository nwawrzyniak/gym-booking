const express = require('express');
const { ensureDataDir } = require('./config/database');
const setupMiddleware = require('./middleware/setup');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup middleware
setupMiddleware(app);

// Register routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', bookingRoutes);
app.use('/', adminRoutes);

// Start server
ensureDataDir().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});