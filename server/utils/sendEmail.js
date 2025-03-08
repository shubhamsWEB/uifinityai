const nodemailer = require('nodemailer');
const config = require('../config/default');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });
  
  // Define email options
  const message = {
    from: `${config.email.fromName} <${config.email.fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  
  // Send email
  const info = await transporter.sendMail(message);
  
  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;