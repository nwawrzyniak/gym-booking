const { FILES } = require('../config/database');
const { readJSON } = require('../utils/file-operations');
const { isAdmin } = require('../utils/helpers');

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  next();
};

const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  const users = await readJSON(FILES.users);
  const user = users.find(u => u.id === req.session.userId);
  if (!isAdmin(user)) {
    return res.redirect('/dashboard');
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin
};