const fs = require('fs').promises;
const path = require('path');
const transporter = require('../config/email');

const sendRegistrationEmail = async (user, token) => {
  const approveUrlHumor = `${process.env.BASE_URL}/admin/approve/${token}?humor=true`;
  const approveUrlNoHumor = `${process.env.BASE_URL}/admin/approve/${token}?humor=false`;
  const rejectUrl = `${process.env.BASE_URL}/admin/reject/${token}`;
  const blockUrl = `${process.env.BASE_URL}/admin/block/${token}`;

  // Read template
  const templatePath = path.join(__dirname, '../../templates/html/admin-registration-email.html');
  let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

  // Replace placeholders
  const html = htmlTemplate
    .replace('{{firstName}}', user.firstName)
    .replace('{{lastName}}', user.lastName)
    .replace('{{displayName}}', user.displayName)
    .replace('{{email}}', user.email)
    .replace('{{ip}}', user.ip)
    .replace('{{date}}', new Date().toLocaleString('de-DE'))
    .replace('{{approveUrlHumor}}', approveUrlHumor)
    .replace('{{approveUrlNoHumor}}', approveUrlNoHumor)
    .replace('{{rejectUrl}}', rejectUrl)
    .replace('{{blockUrl}}', blockUrl);

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'Neue Registrierung - Gym Booking System',
    html
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email error:', err);
    throw err;
  }
};

module.exports = {
  sendRegistrationEmail
};