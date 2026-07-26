const User = require('../models/user');
const Mentor = require('../models/mentor');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../utils/otp');
const { sendEmail } = require('../config/nodemailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_me', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    let finalRole = role || 'student';
    if (email.toLowerCase() === 'admin@aspira.com') {
      finalRole = 'admin';
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      otp: otpCode,
      otpExpiry,
      isVerified: false,
      isApproved: finalRole === 'mentor' ? false : true
    });

    // Log generated OTP to server logs for dev/fallback convenience
    console.log(`[OTP DISPATCH] Generated OTP ${otpCode} for user ${user.email}`);

    // Send verification email asynchronously in background
    sendEmail({
      to: user.email,
      subject: 'Aspira Account Verification OTP',
      text: `Welcome to Aspira, ${user.name}! Your verification OTP is: ${otpCode}. Valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Welcome to Aspira!</h2>
          <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your account:</p>
          <div style="background-color: #F3F4F6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 6px; letter-spacing: 4px; margin: 20px 0; color: #111827;">
            ${otpCode}
          </div>
          <p style="font-size: 14px; color: #6B7280;">This OTP will expire in 10 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9CA3AF;">If you did not request this registration, please ignore this email.</p>
        </div>
      `
    }).catch(mailError => {
      console.error('Nodemailer failed to dispatch verification email on registration:', mailError.message);
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification OTP sent to email.',
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Verify OTP and activate account
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Set isApproved message if unapproved mentor
    if (user.role === 'mentor' && !user.isApproved) {
      return res.status(200).json({
        success: true,
        message: 'Email verified! Your mentor application is pending approval by the administrator.',
        pendingApproval: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isApproved: user.isApproved
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // User is not verified yet, send another OTP
      const otpCode = generateOTP();
      user.otp = otpCode;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      console.log(`[OTP DISPATCH] Generated unverified login OTP ${otpCode} for user ${user.email}`);

      sendEmail({
        to: user.email,
        subject: 'Aspira Account Verification OTP',
        text: `Your verification OTP is: ${otpCode}. Valid for 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #4F46E5;">Please Verify Your Account</h2>
            <p>Your account is not verified. Use the following One-Time Password (OTP) to complete verification:</p>
            <div style="background-color: #F3F4F6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 6px; letter-spacing: 4px; margin: 20px 0; color: #111827;">
              ${otpCode}
            </div>
            <p style="font-size: 14px; color: #6B7280;">This OTP will expire in 10 minutes.</p>
          </div>
        `
      }).catch(mailError => {
        console.error('Nodemailer failed to dispatch OTP email on unverified login:', mailError.message);
      });

      return res.status(403).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.',
        unverified: true,
        email: user.email
      });
    }

    if (user.role === 'mentor' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your mentor application is pending approval by the administrator.'
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        department: user.department,
        year: user.year,
        bio: user.bio,
        github: user.github,
        linkedin: user.linkedin,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email address' });
    }

    const otpCode = generateOTP();
    user.otp = otpCode;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[OTP DISPATCH] Generated Forgot Password OTP ${otpCode} for user ${user.email}`);

    sendEmail({
      to: user.email,
      subject: 'Aspira Password Reset OTP',
      text: `Your password reset OTP is: ${otpCode}. Valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #EF4444;">Password Reset Request</h2>
          <p>You requested a password reset. Please use the following One-Time Password (OTP) to verify your identity:</p>
          <div style="background-color: #F3F4F6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 6px; letter-spacing: 4px; margin: 20px 0; color: #111827;">
            ${otpCode}
          </div>
          <p style="font-size: 14px; color: #6B7280;">This OTP will expire in 10 minutes.</p>
        </div>
      `
    }).catch(mailError => {
      console.error('Nodemailer failed to dispatch OTP email on forgot password request:', mailError.message);
    });

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to email successfully.',
      email: user.email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    user.password = newPassword; // Pre-save hook hashes this automatically
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

module.exports = {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  getMe
};
