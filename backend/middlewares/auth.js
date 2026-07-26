const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_me');
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User session not found' });
      }
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const verifiedOnly = (req, res, next) => {
  if (req.user && !req.user.isVerified) {
    return res.status(403).json({ success: false, message: 'Please verify your email address to access this resource.' });
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'guest'}) does not have permission to access this resource`
      });
    }
    next();
  };
};

const eligibleForPlacementOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  const eligibleYears = ['3', '4', 'Third Year', 'Fourth Year'];
  if (!req.user || !eligibleYears.includes(req.user.year)) {
    return res.status(403).json({
      success: false,
      message: 'Placement Tracker and AI Mock Interview systems are available from Third Year onwards.'
    });
  }
  next();
};

module.exports = {
  protect,
  verifiedOnly,
  restrictTo,
  eligibleForPlacementOnly
};
