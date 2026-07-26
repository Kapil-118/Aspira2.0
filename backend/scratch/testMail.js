require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

console.log('Testing Nodemailer with user:', process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
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

const mailOptions = {
  from: `"Aspira Test" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER, // Send to self
  subject: 'Aspira SMTP Diagnostics',
  text: 'This is a diagnostic test email from the Aspira application.'
};

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('SUCCESS! Email sent successfully.');
    console.log('Response:', info.response);
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR! Failed to send email.');
    console.error(err);
    process.exit(1);
  });
