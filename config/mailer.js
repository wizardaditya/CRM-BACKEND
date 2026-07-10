const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param {object} options - { to, subject, html, text }
 */
const sendMail = async (options) => {
  const mailOptions = {
    from: `"A5X CRM" <${process.env.SMTP_FROM}>`,
    to:      options.to,
    subject: options.subject,
    html:    options.html,
    text:    options.text,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendMail, transporter };
