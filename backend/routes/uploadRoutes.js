/**
 * uploadRoutes.js
 * CMS image upload — admin-authenticated, signed Cloudinary upload.
 * No upload preset required — uses API key + secret from backend env.
 * POST /api/upload/cms  → returns { success, url }
 */

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const crypto    = require('crypto');
const FormData  = require('form-data');
const adminAuth = require('../middleware/adminAuth');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp|svg/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function uploadToCloudinary(buffer, originalname) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured in backend .env');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder    = 'eternarest/cms';

  // Signature must cover exactly the params sent (alphabetical order)
  const sigStr    = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  // Detect content type from extension
  const ext = path.extname(originalname).toLowerCase().replace('.', '');
  const contentType = ext === 'png' ? 'image/png'
    : ext === 'gif'  ? 'image/gif'
    : ext === 'webp' ? 'image/webp'
    : ext === 'svg'  ? 'image/svg+xml'
    : 'image/jpeg';

  const form = new FormData();
  form.append('file', buffer, { filename: originalname, contentType });
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method:  'POST',
    body:    form,
    headers: form.getHeaders(),
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Cloudinary error ${res.status}`);
  }

  return json.secure_url;
}

// POST /api/upload/cms  (admin only)
router.post('/cms', adminAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    const url = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    return res.json({ success: true, url });
  } catch (err) {
    console.error('❌ CMS upload error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
