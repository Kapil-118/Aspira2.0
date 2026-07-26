const generateOTP = () => {
  // Generate a random 6-digit numeric OTP code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  generateOTP
};
