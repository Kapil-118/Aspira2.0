const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Ensure local upload directories exist
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
// For simplicity, we use memory storage. We then process the buffer.
// If Cloudinary is active, upload stream.
// If Cloudinary is off, write file locally.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Upload images (png, jpg, jpeg) or PDF files only.'), false);
  }
};

const multerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limits
  fileFilter
});

// Middleware helper to handle upload
const handleImageUpload = (fieldName) => {
  return (req, res, next) => {
    multerUpload.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return next(); // Proceed without file upload if optional
      }

      try {
        if (isCloudinaryConfigured) {
          // Cloudinary Upload
          const uploadPromise = () => new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: 'aspira_uploads', resource_type: 'auto' },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            uploadStream.end(req.file.buffer);
          });

          const result = await uploadPromise();
          req.file.url = result.secure_url;
        } else {
          // Local Storage Fallback
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
          const localPath = path.join(uploadDir, uniqueFilename);
          
          fs.writeFileSync(localPath, req.file.buffer);
          
          // Attach relative path accessible from browser
          req.file.url = `/uploads/${uniqueFilename}`;
        }
        next();
      } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ success: false, message: 'File upload processing failed.' });
      }
    });
  };
};

module.exports = {
  multerUpload,
  handleImageUpload
};
