// Helper functions for user roles
const isAdmin = (user) => {
  return user && (user.role === 'admin' || user.role === 'super-admin');
};

const isSuperAdmin = (user) => {
  return user && user.role === 'super-admin';
};

module.exports = {
  isAdmin,
  isSuperAdmin
};