const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_NAME &&
  process.env.CLOUDINARY_KEY &&
  process.env.CLOUDINARY_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
  });
  console.log('Cloudinary Service Configured Successfully.');
} else {
  console.warn('WARNING: Cloudinary credentials not configured. Falling back to local server storage for uploads.');
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured
};
