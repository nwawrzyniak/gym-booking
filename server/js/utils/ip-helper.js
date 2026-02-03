// Get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress;
};

module.exports = {
  getClientIP
};