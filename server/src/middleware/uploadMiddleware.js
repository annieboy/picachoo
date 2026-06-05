const multer = require('multer');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// memoryStorage keeps the buffer in RAM — no temp files written to disk,
// nothing to clean up. Acceptable because we stream straight to Drive.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(`Unsupported file type: ${file.mimetype}. Accepted: JPEG, PNG, WEBP, HEIC.`);
      err.status = 415;
      cb(err);
    }
  },
});

// Wrap multer so its errors get the right HTTP status before reaching
// the global error handler.
function singleImageUpload(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      err.status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      err.message = err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
        : err.message;
    }
    next(err);
  });
}

module.exports = { singleImageUpload };
