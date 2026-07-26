const nodemailer = require('nodemailer');

const isEmailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  console.log('Nodemailer SMTP Transporter initialized on port 465.');
} else {
  console.warn('WARNING: Nodemailer SMTP email credentials not configured. Email OTPs will be printed directly to the server terminal console for development.');
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (isEmailConfigured && transporter) {
    const mailOptions = {
      from: `"Aspira Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };
    return transporter.sendMail(mailOptions);
  } else {
    console.log('\n--- DEVELOPMENT EMAIL SIMULATION ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Text Body:\n${text}`);
    if (html) console.log(`HTML Body:\n${html}`);
    console.log('-------------------------------------\n');
    return Promise.resolve({ messageId: 'dev-mode-fake-id' });
  }
};

module.exports = {
  sendEmail,
  isEmailConfigured
};
