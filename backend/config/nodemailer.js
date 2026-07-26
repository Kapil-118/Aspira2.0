const axios = require('axios');
const nodemailer = require('nodemailer');

const resendApiKey = process.env.RESEND_API_KEY;
const isEmailConfigured = !!(resendApiKey || (process.env.EMAIL_USER && process.env.EMAIL_PASS));

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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
}

const sendEmail = async ({ to, subject, text, html }) => {
  // 1. Primary Engine: High-speed Resend API
  if (resendApiKey) {
    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'Aspira Support <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html || `<p>${text}</p>`,
          text: text
        },
        {
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[RESEND SUCCESS] Email dispatched instantly to ${to} (ID: ${response.data.id})`);
      return response.data;
    } catch (resendError) {
      console.warn('Resend API notice/error:', resendError.response?.data?.message || resendError.message);
      console.log('Falling back to Gmail SMTP engine...');
    }
  }

  // 2. Secondary Engine: Gmail SMTP Fallback
  if (transporter && process.env.EMAIL_USER) {
    try {
      const mailOptions = {
        from: `"Aspira Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };
      const result = await transporter.sendMail(mailOptions);
      console.log(`[GMAIL SMTP SUCCESS] Email dispatched to ${to}`);
      return result;
    } catch (smtpError) {
      console.error('Gmail SMTP Dispatch Error:', smtpError.message);
    }
  }

  // 3. Fallback: Development Simulation
  console.log('\n--- EMAIL DISPATCH SIMULATION ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  if (text) console.log(`Text Body:\n${text}`);
  console.log('-----------------------------------\n');
  return Promise.resolve({ messageId: 'simulated-id' });
};

module.exports = {
  sendEmail,
  isEmailConfigured
};
